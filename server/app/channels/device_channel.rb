class DeviceChannel < ApplicationCable::Channel
  def subscribed
    return reject unless current_device.present?

    current_device.mark_seen!
    @connection_token = current_device.mark_connected!
    stream_for current_device
    Devices::Fans::ReconcileConnection.call(device: current_device)
    Devices::Watering::SyncSchedules.call(at: Time.current, device: current_device)
  end

  def unsubscribed
    current_device&.mark_disconnected!(@connection_token)
  end

  def transmit_to_device(message)
    transmit(message)
  end

  def receive(data)
    return unless current_device.present?
    return unless current_device.mark_connected!(@connection_token)

    current_device.mark_seen!

    case data["type"]
    when "measurement.create"
      Devices::Measurements::Create.call(device: current_device, data: data, channel: self)
    when "fan.update"
      Devices::Fans::HandleUpdate.call(device: current_device, data: data)
    when "water_pump.update"
      Devices::Watering::HandleUpdate.call(device: current_device, data: data)
    when "window.update"
      Devices::Windows::HandleUpdate.call(device: current_device, data: data)
    when "error"
      Rails.logger.warn("Device protocol error for #{current_device.id}: #{data.inspect}")
    end
  end
end
