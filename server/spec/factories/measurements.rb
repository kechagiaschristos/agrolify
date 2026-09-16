FactoryBot.define do
  factory :measurement do
    association :device

    air_temperature_c { 24.5 }
    air_humidity { 55.0 }
    soil_temperature_c { 21.5 }
    soil_moisture { 45.0 }
    gps_latitude { 37.983810 }
    gps_longitude { 23.727539 }
    water_level_liters { 40 }

    trait :empty do
      air_temperature_c { nil }
      air_humidity { nil }
      soil_temperature_c { nil }
      soil_moisture { nil }
      gps_latitude { nil }
      gps_longitude { nil }
      water_level_liters { nil }
    end

    trait :hot do
      air_temperature_c { 35.0 }
      soil_temperature_c { 29.0 }
    end

    trait :cold do
      air_temperature_c { 5.0 }
      soil_temperature_c { 8.0 }
    end

    trait :dry do
      air_humidity { 25.0 }
      soil_moisture { 15.0 }
    end

    trait :humid do
      air_humidity { 85.0 }
      soil_moisture { 75.0 }
    end

    trait :low_water do
      water_level_liters { 5 }
    end

    trait :full_water do
      water_level_liters { 50 }
    end
  end
end
