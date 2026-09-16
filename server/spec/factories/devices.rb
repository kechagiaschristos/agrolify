FactoryBot.define do
  factory :device do
    association :user

    sequence(:name) { |n| "Greenhouse Device #{n}" }
    sequence(:code) { |n| "DEV#{n.to_s.rjust(4, '0')}" }
    sequence(:token) { |n| "device-token-#{n.to_s.rjust(16, '0')}" }

    description { "Greenhouse device description" }

    temperature_air_min_c { 18 }
    temperature_air_max_c { 28 }
    ventilation_temperature_min_c { 20 }
    ventilation_temperature_max_c { 26 }
    water_tank_capacity_liters { 50 }

    temperature_unit { "cel" }
    liquid_unit { "liters" }
    time_zone { "UTC" }

    last_seen_at { nil }

    trait :online do
      last_seen_at { 30.seconds.ago }
    end

    trait :connected do
      last_seen_at { 30.seconds.ago }

      after(:create) do |device|
        device.mark_connected!
      end
    end

    trait :offline do
      last_seen_at { 2.hours.ago }

      after(:create) do |device|
        device.mark_disconnected!
      end
    end

    trait :never_seen do
      last_seen_at { nil }
    end

    trait :fahrenheit do
      temperature_unit { "fah" }
    end

    trait :gallons do
      liquid_unit { "gallons" }
    end

    trait :without_user do
      user { nil }
    end
  end
end
