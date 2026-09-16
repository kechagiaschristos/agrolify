module Devices
  class FansController < SelectedDeviceController
    def show
      fan = device.fan

      render json: {
        code: "FAN_FETCHED",
        fan: fan ? FanSerializer.new(fan) : nil
      }, status: :ok
    end

    def update
      fan = device.fan
      return render json: { code: "FAN_NOT_FOUND" }, status: :not_found unless fan

      return render_device_offline unless device.connected?

      errors = Devices::Fans::RequestUpdate.call(
        device: device,
        fan: fan,
        params: fan_params
      )

      return render_fan_updated(fan) if errors.empty?

      render_fan_update_failed(errors)
    end

    private

    def fan_params
      params.require(:fan).permit(:status, :mode)
    end

    def render_fan_updated(fan)
      pending = device.device_commands.pending.exists?(kind: "fan.update")
      render json: {
        code: pending ? "FAN_COMMAND_PENDING" : "FAN_UPDATED",
        fan: FanSerializer.new(fan.reload)
      }, status: pending ? :accepted : :ok
    end

    def render_fan_update_failed(errors)
      render json: {
        code: "FAN_UPDATE_FAILED",
        errors: errors
      }, status: :unprocessable_entity
    end
  end
end
