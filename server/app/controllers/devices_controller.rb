class DevicesController < BaseController
  def index
    devices = current_user.devices
    render json: {
      code: "DEVICES_FETCHED",
      devices: devices.map { |device| DeviceSerializer.new(device) }
    }, status: :ok
  end

  def show
    device = current_user.devices.find_by(code: params[:code])
    return render_device_not_found unless device

    render json: {
      code: "DEVICE_FETCHED",
      device: DeviceSerializer.new(device)
    }, status: :ok
  end

  def attach
    device = Device.find_by(code: params[:code])
    return render_device_not_found unless device

    device.with_lock do
      if device.user_id.nil?
        if device.update(user: current_user)
          render json: {
            code: "DEVICE_ATTACHED",
            device: DeviceSerializer.new(device)
          }, status: :ok
        else
          render json: {
            code: "DEVICE_ATTACH_FAILED",
            errors: device.errors.full_messages
          }, status: :unprocessable_entity
        end
      elsif device.user_id == current_user.id
        render json: {
          code: "DEVICE_ALREADY_ATTACHED",
          device: DeviceSerializer.new(device)
        }, status: :ok
      else
        render json: {
          code: "DEVICE_ALREADY_ASSIGNED"
        }, status: :conflict
      end
    end
  end

  def update
    device = current_user.devices.find_by(code: params[:code])
    return render_device_not_found unless device

    if params[:device].blank?
      render json: {
        code: "DEVICE_UPDATE_FAILED",
        errors: [ "No device settings were provided" ]
      }, status: :unprocessable_entity
      return
    end

    if device.update(device_params)
      fan = device.fan
      temperature_thresholds_changed =
        device.saved_change_to_temperature_air_min_c? || device.saved_change_to_temperature_air_max_c?

      if device.connected? && fan && fan.mode == Fan::MODES[:auto] && temperature_thresholds_changed
        Devices::Fans::SyncAutomation.call(
          device: device,
          measurement: device.measurements.order(created_at: :desc).first
        )
      end

      render json: {
        code: "DEVICE_UPDATED",
        device: DeviceSerializer.new(device)
      }, status: :ok
    else
      render json: {
        code: "DEVICE_UPDATE_FAILED",
        errors: device.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def detach
    device = current_user.devices.find_by(code: params[:code])
    return render_device_not_found unless device

    ActiveRecord::Base.transaction do
      device.update!(user: nil)
      current_user.update!(selected_device_code: nil) if current_user.selected_device_code == device.code
    end

    render json: {
      code: "DEVICE_DETACHED",
      device_code: device.code
    }, status: :ok
  rescue ActiveRecord::RecordInvalid => error
    render json: {
      code: "DEVICE_DETACH_FAILED",
      errors: error.record&.errors&.full_messages || [ error.message ]
    }, status: :unprocessable_entity
  end

  private

  def device_params
    params.require(:device).permit(
      :name,
      :description,
      :temperature_air_min_c,
      :temperature_air_max_c,
      :ventilation_temperature_min_c,
      :ventilation_temperature_max_c,
      :water_tank_capacity_liters,
      :temperature_unit,
      :liquid_unit,
      :time_zone
    )
  end
end
