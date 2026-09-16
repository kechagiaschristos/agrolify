class MeasurementSerializer
  def initialize(measurement)
    @measurement = measurement
  end

  def as_json(*)
    {
      id: attribute(:id),
      device_id: attribute(:device_id),
      air_temperature_c: attribute(:air_temperature_c),
      air_humidity: attribute(:air_humidity),
      soil_temperature_c: attribute(:soil_temperature_c),
      soil_moisture: attribute(:soil_moisture),
      water_level_liters: attribute(:water_level_liters),
      gps_latitude: attribute(:gps_latitude),
      gps_longitude: attribute(:gps_longitude),
      avg_temperature_c: attribute(:avg_temperature_c),
      avg_humidity: attribute(:avg_humidity),
      avg_soil_temperature_c: attribute(:avg_soil_temperature_c),
      avg_moisture: attribute(:avg_moisture),
      avg_water_level_liters: attribute(:avg_water_level_liters),
      created_at: timestamp(:created_at),
      updated_at: timestamp(:updated_at)
    }
  end

  private

  def attribute(name)
    @measurement.attributes[name.to_s]
  end

  def timestamp(name)
    attribute(name)&.iso8601
  end
end
