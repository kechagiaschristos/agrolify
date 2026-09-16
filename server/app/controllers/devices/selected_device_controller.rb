module Devices
  class SelectedDeviceController < ::BaseController
    before_action :require_current_device

    private

    attr_reader :device

    def require_current_device
      @device = if params[:device_code].present?
        current_user.devices.find_by(code: params[:device_code])
      else
        current_device
      end
      render_device_not_found unless device
    end
  end
end
