class DeviceSerializer
  def initialize(device)
    @device = device
  end

  def as_json(*)
    {
      id: @device.id,
      code: @device.code,
      name: @device.name,
      description: @device.description,
      temperature_air_min_c: @device.temperature_air_min_c,
      temperature_air_max_c: @device.temperature_air_max_c,
      ventilation_temperature_min_c: @device.ventilation_temperature_min_c,
      ventilation_temperature_max_c: @device.ventilation_temperature_max_c,
      water_tank_capacity_liters: @device.water_tank_capacity_liters,
      temperature_unit: @device.temperature_unit,
      liquid_unit: @device.liquid_unit,
      time_zone: @device.time_zone,
      last_seen_at: @device.last_seen_at&.iso8601,
      created_at: @device.created_at&.iso8601,
      updated_at: @device.updated_at&.iso8601
    }
  end
end
