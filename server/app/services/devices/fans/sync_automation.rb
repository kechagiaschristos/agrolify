module Devices
  module Fans
    class SyncAutomation
      def self.call(device:, measurement:)
        new(device:, measurement:).call
      end

      def initialize(device:, measurement:)
        @device = device
        @measurement = measurement
      end

      def call
        @device.with_lock do
        fan = @device.fan
        return unless fan
        fan.reload
        return unless fan.mode == Fan::MODES[:auto]

        desired_status = Devices::Fans::AutoModeStatus.call(
          device: @device,
          measurement: @measurement,
          current_status: fan.status
        )

        pending = @device.device_commands.pending.exists?(kind: "fan.update")
        return if desired_status == fan.status && !pending

        Devices::Fans::RequestUpdate.send_command(
          device: @device,
          status: desired_status,
          mode: Fan::MODES[:auto]
        )
        end
      end
    end
  end
end
