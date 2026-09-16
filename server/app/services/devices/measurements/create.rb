module Devices
  module Measurements
    class Create
      def self.call(device:, data:, channel:)
        new(device:, data:, channel:).call
      end

      def initialize(device:, data:, channel:)
        @device = device
        @data = data
        @channel = channel
      end

      def call
        payload = @data["payload"] || {}

        measurement = @device.measurements.create(
          air_temperature_c: payload["air_temperature_c"],
          air_humidity: payload["air_humidity"],
          soil_temperature_c: payload["soil_temperature_c"],
          soil_moisture: payload["soil_moisture"],
          water_level_liters: payload["water_level_liters"],
          gps_latitude: payload["gps_latitude"],
          gps_longitude: payload["gps_longitude"]
        )

        if measurement.persisted?
          MeasurementsChannel.broadcast_to(@device, {
            type: "measurement.created",
            measurement: {
              id: measurement.id,
              device_id: measurement.device_id,
              air_temperature_c: measurement.air_temperature_c,
              air_humidity: measurement.air_humidity,
              soil_temperature_c: measurement.soil_temperature_c,
              soil_moisture: measurement.soil_moisture,
              water_level_liters: measurement.water_level_liters,
              gps_latitude: measurement.gps_latitude,
              gps_longitude: measurement.gps_longitude,
              created_at: measurement.created_at.iso8601
            }
          })

          @channel.transmit_to_device({
            type: "ack",
            message_id: @data["message_id"],
            status: "ok",
            payload: {
              measurement_id: measurement.id,
              stored_at: measurement.created_at.iso8601
            }
          })

          Devices::Fans::SyncAutomation.call(device: @device, measurement: measurement)
          Devices::Watering::SyncSchedules.call(at: measurement.created_at, device: @device)
        else
          @channel.transmit_to_device({
            type: "error",
            message_id: @data["message_id"],
            error: {
              code: "MEASUREMENT_SAVE_FAILED",
              message: measurement.errors.full_messages.to_sentence
            }
          })
        end
      end
    end
  end
end
