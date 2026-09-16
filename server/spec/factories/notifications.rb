FactoryBot.define do
  factory :notification do
    association :user
    device { association(:device, user: user) }

    kind { "device_alert" }
    title { "Device alert" }
    message { "The device needs attention." }
    read_at { nil }

    trait :read do
      read_at { Time.current }
    end

    trait :unread do
      read_at { nil }
    end

    trait :water_tank_alert do
      kind { "water_tank_alert" }
      title { "Water tank low" }
      message { "The water tank level is low." }
    end

    trait :humidity_warning do
      kind { "humidity_warning" }
      title { "Humidity warning" }
      message { "Humidity is outside the expected range." }
    end

    trait :watering_update do
      kind { "watering_update" }
      title { "Watering update" }
      message { "Watering schedule was updated." }
    end

    trait :irrigation_started do
      kind { "irrigation_started" }
      title { "Irrigation started" }
      message { "The irrigation cycle has started." }
    end

    trait :irrigation_finished do
      kind { "irrigation_finished" }
      title { "Irrigation finished" }
      message { "The irrigation cycle has finished." }
    end
  end
end
