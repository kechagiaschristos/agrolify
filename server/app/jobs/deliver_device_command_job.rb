class DeliverDeviceCommandJob < ApplicationJob
  queue_as :default

  def perform(command_id)
    command = DeviceCommand.find_by(id: command_id)
    return unless command

    command.device.with_lock do
      command.reload
      return unless command.pending?

      if command.expires_at && command.expires_at <= Time.current
        command.update!(status: "failed", error_code: "confirmation_timeout")
        return
      end
      return unless command.device.connected?
      return if command.last_sent_at && command.last_sent_at > DeviceCommand::RETRY_INTERVAL.ago

      command.update!(last_sent_at: Time.current, attempts: command.attempts + 1)
      parameters = command.parameters.dup
      if command.kind == "water_pump.update" && parameters["status"] == "on"
        parameters["lease_seconds"] = [ parameters.fetch("lease_seconds"), (command.expires_at - Time.current).floor ].min
        return if parameters["lease_seconds"] <= 0
      end
      DeviceChannel.broadcast_to(command.device, {
        type: "command.execute", message_id: command.id,
        payload: { command: command.kind, params: parameters }
      })
    end
  end
end
