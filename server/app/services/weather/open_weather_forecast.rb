require "json"
require "net/http"
require "uri"

module Weather
  class OpenWeatherForecast
    API_URL = "https://api.openweathermap.org/data/2.5/forecast".freeze
    UNITS = "metric".freeze
    DAILY_LIMIT = 5
    DEFAULT_LOCALE = "en".freeze
    SUPPORTED_LOCALES = %w[en el].freeze
    REQUEST_TIMEOUT_SECONDS = 3
    NOON_HOUR = 12

    class Error < StandardError; end
    class MissingApiKeyError < Error; end
    class LocationUnavailableError < Error; end
    class RequestFailedError < Error; end

    def self.call(device:, locale: DEFAULT_LOCALE)
      new(device:, locale:).call
    end

    def initialize(device:, locale: DEFAULT_LOCALE)
      @device = device
      @locale = normalize_locale(locale)
    end

    def call
      raise MissingApiKeyError, "OPENWEATHER_API_KEY is not configured" if api_key.blank?

      latitude, longitude = latest_coordinates
      payload = fetch_forecast(latitude:, longitude:)

      Time.use_zone(@device.schedule_time_zone) do
        serialize_forecast(payload)
      end
    end

    private

    def api_key
      ENV["OPENWEATHER_API_KEY"].to_s
    end

    def latest_coordinates
      latest_measurement = @device.measurements.order(created_at: :desc).first
      latitude = to_coordinate(latest_measurement&.gps_latitude)
      longitude = to_coordinate(latest_measurement&.gps_longitude)

      raise LocationUnavailableError, "Latest device measurement does not include GPS coordinates" unless latitude && longitude

      [latitude, longitude]
    end

    def to_coordinate(value)
      number = Float(value)
      number if number.finite?
    rescue ArgumentError, TypeError
      nil
    end

    def fetch_forecast(latitude:, longitude:)
      uri = URI.parse(API_URL)
      uri.query = URI.encode_www_form(
        lat: latitude,
        lon: longitude,
        appid: api_key,
        units: UNITS,
        lang: @locale
      )

      response = Net::HTTP.start(
        uri.host,
        uri.port,
        use_ssl: true,
        open_timeout: REQUEST_TIMEOUT_SECONDS,
        read_timeout: REQUEST_TIMEOUT_SECONDS
      ) do |http|
        http.request(Net::HTTP::Get.new(uri))
      end

      raise RequestFailedError, "OpenWeather request failed with status #{response.code}" unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue JSON::ParserError => error
      raise RequestFailedError, "OpenWeather response parsing failed: #{error.message}"
    rescue StandardError => error
      raise error if error.is_a?(Error)

      raise RequestFailedError, "OpenWeather request failed: #{error.message}"
    end

    def normalize_locale(value)
      locale = value.to_s.downcase.split(/[-_]/).first
      SUPPORTED_LOCALES.include?(locale) ? locale : DEFAULT_LOCALE
    end

    def serialize_forecast(payload)
      entries = Array(payload["list"])
      raise RequestFailedError, "OpenWeather response did not include forecast entries" if entries.empty?

      {
        location: {
          name: payload.dig("city", "name"),
          country: payload.dig("city", "country")
        },
        current: serialize_current(entries.first),
        daily: serialize_daily(entries)
      }
    end

    def serialize_current(entry)
      weather = Array(entry&.dig("weather")).first || {}

      {
        at: timestamp_to_iso8601(entry&.dig("dt")),
        temperature_c: entry&.dig("main", "temp"),
        humidity: entry&.dig("main", "humidity"),
        precipitation_probability: entry&.dig("pop"),
        wind_speed_mps: entry&.dig("wind", "speed"),
        condition: weather["main"],
        description: weather["description"],
        icon: weather["icon"]
      }
    end

    def serialize_daily(entries)
      entries
        .group_by { |entry| timestamp_to_date(entry["dt"]) }
        .sort_by { |date, _| date }
        .first(DAILY_LIMIT)
        .map { |date, day_entries| serialize_day(date, day_entries) }
    end

    def serialize_day(date, entries)
      representative_entry = entries.min_by do |entry|
        time_of_day_distance(entry["dt"]) || Float::INFINITY
      end || entries.first

      weather = Array(representative_entry&.dig("weather")).first || {}
      temperatures = entries.filter_map { |entry| entry.dig("main", "temp") }
      precipitation_probabilities = entries.filter_map { |entry| entry["pop"] }

      {
        date: date&.iso8601,
        temp_min_c: temperatures.min,
        temp_max_c: temperatures.max,
        precipitation_probability: precipitation_probabilities.max,
        condition: weather["main"],
        description: weather["description"],
        icon: weather["icon"],
        points: serialize_points(entries)
      }
    end

    def serialize_points(entries)
      entries.map do |entry|
        {
          at: timestamp_to_iso8601(entry["dt"]),
          temperature_c: entry&.dig("main", "temp"),
          precipitation_probability: entry["pop"],
          wind_speed_mps: entry&.dig("wind", "speed")
        }
      end
    end

    def timestamp_to_iso8601(value)
      return nil unless value

      Time.zone.at(value.to_i).iso8601
    end

    def timestamp_to_date(value)
      return nil unless value

      Time.zone.at(value.to_i).to_date
    end

    def time_of_day_distance(value)
      time = value ? Time.zone.at(value.to_i) : nil
      return nil unless time

      (time.hour - NOON_HOUR).abs
    end
  end
end
