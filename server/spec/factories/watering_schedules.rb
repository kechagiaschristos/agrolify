# spec/factories/watering_schedules.rb

FactoryBot.define do
  factory :watering_schedule do
    association :device

    day_of_week { 1 }
    start_time { Time.zone.parse("08:00") }
    end_time { Time.zone.parse("08:30") }
    active { false }

    trait :active do
      active { true }
    end

    trait :inactive do
      active { false }
    end

    trait :sunday do
      day_of_week { 0 }
    end

    trait :monday do
      day_of_week { 1 }
    end

    trait :tuesday do
      day_of_week { 2 }
    end

    trait :wednesday do
      day_of_week { 3 }
    end

    trait :thursday do
      day_of_week { 4 }
    end

    trait :friday do
      day_of_week { 5 }
    end

    trait :saturday do
      day_of_week { 6 }
    end

    trait :morning do
      start_time { Time.zone.parse("08:00") }
      end_time { Time.zone.parse("08:30") }
    end

    trait :evening do
      start_time { Time.zone.parse("18:00") }
      end_time { Time.zone.parse("18:30") }
    end
  end
end
