class Measurement < ApplicationRecord
  belongs_to :device, inverse_of: :measurements

  validates :air_temperature_c, :soil_temperature_c,
            numericality: { greater_than: -100, less_than: 100 },
            allow_nil: true

  validates :air_humidity, :soil_moisture,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 },
            allow_nil: true

  validates :gps_latitude,
            numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 },
            allow_nil: true

  validates :gps_longitude,
            numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 },
            allow_nil: true

  validates :water_level_liters,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true

end
