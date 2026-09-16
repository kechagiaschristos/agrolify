module Devices
  class MeasurementsController < SelectedDeviceController
    def index
      period = params[:period].to_s.presence || "day"
      date = parse_date(params[:date])

      render json: {
        code: "MEASUREMENTS_FETCHED",
        type: params[:type].to_s,
        period: period,
        date: date,
        measurements: serialize_measurements(measurements_for(device, period, date))
      }, status: :ok
    end

    def latest
      render json: {
        code: "MEASUREMENTS_FETCHED",
        measurements: serialize_measurements(device.measurements.order(created_at: :desc).limit(5))
      }, status: :ok
    end

    private

    def parse_date(value)
      Date.parse(value.to_s)
    rescue ArgumentError, TypeError
      Date.current
    end

    def measurements_for(device, period, date)
      time_range = case period
      when "week"
        date.beginning_of_week(:monday)..date.end_of_week(:monday)
      when "month"
        date.beginning_of_month..date.end_of_month
      when "year"
        date.beginning_of_year..date.end_of_year
      else
        date.beginning_of_day..date.end_of_day
      end

      scoped_measurements = device.measurements.where(created_at: time_range)

      case period
      when "year"
        aggregated_measurements(scoped_measurements, "month")
      when "week", "month"
        aggregated_measurements(scoped_measurements, "day")
      else
        scoped_measurements.order(created_at: :asc)
      end
    end

    def aggregated_measurements(measurements, interval)
      created_at_expression = "date_trunc('#{interval}', created_at)"

      measurements
        .select(
          "#{created_at_expression} AS created_at",
          "AVG(air_temperature_c) AS avg_temperature_c",
          "AVG(air_humidity) AS avg_humidity",
          "AVG(soil_temperature_c) AS avg_soil_temperature_c",
          "AVG(soil_moisture) AS avg_moisture",
          "AVG(water_level_liters) AS avg_water_level_liters"
        )
        .group(created_at_expression)
        .order(Arel.sql("#{created_at_expression} ASC"))
    end

    def serialize_measurements(measurements)
      measurements.map { |measurement| MeasurementSerializer.new(measurement) }
    end
  end
end
