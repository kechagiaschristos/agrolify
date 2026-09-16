class WateringScheduleSerializer
  def initialize(watering_schedule)
    @watering_schedule = watering_schedule
  end

  def as_json(*)
    {
      id: @watering_schedule.id,
      device_id: @watering_schedule.device_id,
      day_of_week: @watering_schedule.day_of_week,
      start_time: format_time(@watering_schedule.start_time),
      end_time: format_time(@watering_schedule.end_time),
      active: @watering_schedule.active,
      created_at: @watering_schedule.created_at&.iso8601,
      updated_at: @watering_schedule.updated_at&.iso8601
    }
  end

  private

  def format_time(value)
    value&.strftime("%H:%M:%S")
  end
end
