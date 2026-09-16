module Devices
  module Fans
    class AutoModeStatus
      def self.call(device:, measurement:, current_status:)
        new(device:, measurement:, current_status:).call
      end

      def initialize(device:, measurement:, current_status:)
        @device = device
        @measurement = measurement
        @current_status = current_status
      end

      def call
        air_temperature = @measurement&.air_temperature_c
        min_air_temperature = @device.temperature_air_min_c
        max_air_temperature = @device.temperature_air_max_c

        return @current_status if air_temperature.nil? || min_air_temperature.nil? || max_air_temperature.nil?

        return "on" if air_temperature >= max_air_temperature
        return "off" if air_temperature <= min_air_temperature

        @current_status
      end
    end
  end
end
