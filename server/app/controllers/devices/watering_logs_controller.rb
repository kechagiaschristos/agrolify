module Devices
  class WateringLogsController < SelectedDeviceController
    PAGE_LIMIT = 20

    def index
      page = [ params[:page].to_i, 1 ].max
      watering_logs = device.watering_logs.order(started_at: :desc)

      render json: {
        code: "WATERING_LOGS_FETCHED",
        watering_logs: watering_logs
          .offset((page - 1) * PAGE_LIMIT)
          .limit(PAGE_LIMIT)
          .map { |log| WateringLogSerializer.new(log) },
        total: watering_logs.count,
        page: page,
        limit: PAGE_LIMIT
      }, status: :ok
    end
  end
end
