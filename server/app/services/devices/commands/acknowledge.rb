module Devices
  module Commands
    class Acknowledge
      def self.call(device:, data:, kind:)
        device.with_lock do
          command = device.device_commands.pending.find_by(id: data["message_id"], kind:)
          return unless command

          unless data["status"] == "ok"
            command.update!(
              status: kind == "water_pump.update" && data.dig("error", "code") != "LEASE_EXPIRED" ? "pending" : "failed",
              error_code: "device_rejected"
            )
            return
          end

          payload = (data["payload"] || {}).stringify_keys
          return if command.expires_at && command.expires_at <= Time.current
          expected = command.parameters.except("lease_seconds")
          return unless expected.except("mode").all? { |key, value| payload[key].to_s == value.to_s }

          command.update!(status: "confirmed", confirmed_at: Time.current, error_code: nil)
          case kind
          when "fan.update"
            device.fan&.update!(status: expected.fetch("status"))
          when "window.update"
            device.window&.update!(expected.slice(*Window::STATUS_ATTRIBUTES.map(&:to_s)))
          when "water_pump.update"
            log = command.watering_log
            return unless log
            if expected["status"] == "on"
              unless log.running?
                log.update!(status: "running")
                notify(device, "irrigation_started", "Irrigation started")
              end
            elsif !log.finished?
              log.update!(status: "finished", finished_at: Time.current)
              notify(device, "irrigation_finished", "Irrigation finished")
            end
          end
        end
      end

      def self.notify(device, kind, title)
        Devices::Notifications::Create.call(device:, kind:, title:, message: "#{title} for #{device.name}.")
      end
      private_class_method :notify
    end
  end
end
