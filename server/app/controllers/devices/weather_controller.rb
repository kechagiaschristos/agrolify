module Devices
  class WeatherController < SelectedDeviceController
    def show
      render json: {
        code: "WEATHER_FORECAST_FETCHED",
        weather: Weather::OpenWeatherForecast.call(
          device: device,
          locale: params[:locale].presence || current_user.locale
        )
      }, status: :ok
    rescue StandardError => error
      Rails.logger.error("WeatherController#show failed: #{error.class}: #{error.message}")
      render json: { code: "WEATHER_FETCH_FAILED" }, status: :internal_server_error
    end
  end
end
