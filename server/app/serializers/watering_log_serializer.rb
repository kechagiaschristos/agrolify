class WateringLogSerializer
  def initialize(watering_log)
    @watering_log = watering_log
  end

  def as_json(*)
    {
      id: @watering_log.id,
      device_id: @watering_log.device_id,
      started_at: @watering_log.started_at&.iso8601,
      finished_at: @watering_log.finished_at&.iso8601,
      status: @watering_log.status,
      water_used_liters: @watering_log.water_used_liters,
      created_at: @watering_log.created_at&.iso8601,
      updated_at: @watering_log.updated_at&.iso8601
    }
  end
end
