class MeasurementsChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user.present?
    selected_device = current_user.devices.find_by(id: params[:device_id])
    reject unless selected_device.present?
    stream_for selected_device
  end
end
