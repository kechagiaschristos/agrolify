module Devices
  module Fans
    class ReconcileConnection
      def self.call(device:)
        device.with_lock do
          fan = device.fan&.reload
          return unless fan

          pending = device.device_commands.pending.find_by(kind: "fan.update")
          status = pending ? pending.parameters.fetch("status") : fan.status
          if fan.mode_auto?
            status = AutoModeStatus.call(
              device:, measurement: device.measurements.order(created_at: :desc).first,
              current_status: fan.status
            )
          end

          # Disconnect disables the relay. A new ID forces execution even if the
          # firmware cached a successful result whose acknowledgement was lost.
          pending&.update!(status: "superseded")
          DeviceCommand.submit!(device:, kind: "fan.update", parameters: { status:, mode: fan.mode })
        end
      end
    end
  end
end
