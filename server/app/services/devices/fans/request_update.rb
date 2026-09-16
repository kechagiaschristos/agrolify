module Devices
  module Fans
    class RequestUpdate
      def self.call(device:, fan:, params:)
        device.with_lock do
          fan.reload
          values = params.to_h.symbolize_keys
          mode = (values[:mode].presence || fan.mode).to_s
          status = (values[:status].presence || fan.status).to_s
          return [ "Mode is invalid" ] unless Fan.valid_mode?(mode)
          return [ "Status is invalid" ] unless Fan.valid_status?(status)

          if mode == Fan::MODES[:auto]
            status = Devices::Fans::AutoModeStatus.call(
              device:, measurement: device.measurements.order(created_at: :desc).first,
              current_status: fan.status
            )
          end
          fan.update!(mode: mode)
          pending = device.device_commands.pending.exists?(kind: "fan.update")
          if pending || fan.status != status
            DeviceCommand.submit!(device:, kind: "fan.update", parameters: { status:, mode: })
          end
          []
        end
      end

      def self.send_command(device:, status:, mode:)
        device.with_lock do
          DeviceCommand.submit!(device:, kind: "fan.update", parameters: { status:, mode: }).id
        end
      end
    end
  end
end
