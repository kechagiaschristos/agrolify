module Devices
  class WateringSchedulesController < SelectedDeviceController
    before_action :set_watering_schedule, only: %i[ update destroy ]

    def index
      render_watering_schedules("WATERING_SCHEDULES_FETCHED")
    end

    def create
      watering_schedule = watering_schedules.create(watering_schedule_params)

      if watering_schedule.persisted?
        render_watering_schedules("WATERING_SCHEDULES_CREATED")
      else
        render_watering_schedule_errors("WATERING_SCHEDULES_CREATE_FAILED", watering_schedule)
      end
    end

    def update
      if @watering_schedule.update(watering_schedule_params)
        render json: {
          code: "WATERING_SCHEDULE_UPDATED",
          watering_schedule: WateringScheduleSerializer.new(@watering_schedule)
        }, status: :ok
      else
        render_watering_schedule_errors("WATERING_SCHEDULE_UPDATE_FAILED", @watering_schedule)
      end
    end

    def destroy
      @watering_schedule.destroy!

      render json: {
        code: "WATERING_SCHEDULE_DELETED",
        schedule_id: @watering_schedule.id
      }, status: :ok
    end

    private

    def set_watering_schedule
      @watering_schedule = watering_schedules.find_by(id: params[:id])
      render_watering_schedule_not_found unless @watering_schedule
    end

    def watering_schedules
      device.watering_schedules
    end

    def watering_schedule_params
      params.fetch(:watering_schedule, params).permit(:day_of_week, :start_time, :end_time, :active)
    end

    def render_watering_schedules(code)
      render json: {
        code: code,
        watering_schedules: serialize_watering_schedules
      }, status: :ok
    end

    def render_watering_schedule_errors(code, watering_schedule)
      render json: {
        code: code,
        errors: watering_schedule.errors.full_messages
      }, status: :unprocessable_entity
    end

    def render_watering_schedule_not_found
      render json: { code: "WATERING_SCHEDULE_NOT_FOUND" }, status: :not_found
    end

    def serialize_watering_schedules
      watering_schedules.map { |watering_schedule| WateringScheduleSerializer.new(watering_schedule) }
    end
  end
end
