module Devices
  class WindowsController < SelectedDeviceController
    def show
      window = device.window

      render json: {
        code: "WINDOW_FETCHED",
        window: window ? WindowSerializer.new(window) : nil
      }, status: :ok
    end

    def update
      window = device.window
      return render json: { code: "WINDOW_NOT_FOUND" }, status: :not_found unless window

      return render_device_offline unless device.connected?

      errors = Devices::Windows::RequestUpdate.call(
        device: device,
        window: window,
        params: window_params
      )

      return render_window_updated(window) if errors.empty?

      render_window_update_failed(errors)
    end

    private

    def window_params
      params.require(:window).permit(
        :left_window_status,
        :right_window_status
      )
    end

    def render_window_updated(window)
      pending = device.device_commands.pending.exists?(kind: "window.update")
      render json: {
        code: pending ? "WINDOW_COMMAND_PENDING" : "WINDOW_UPDATED",
        window: WindowSerializer.new(window.reload)
      }, status: pending ? :accepted : :ok
    end

    def render_window_update_failed(errors)
      render json: {
        code: "WINDOW_UPDATE_FAILED",
        errors: errors
      }, status: :unprocessable_entity
    end
  end
end
