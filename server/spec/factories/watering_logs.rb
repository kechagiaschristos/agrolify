FactoryBot.define do
  factory :watering_log do
    association :device

    started_at { Time.current }
    finished_at { nil }
    status { "running" }
    water_used_liters { nil }

    trait :starting do
      status { "starting" }
      finished_at { nil }
      water_used_liters { nil }
    end

    trait :running do
      status { "running" }
      finished_at { nil }
      water_used_liters { nil }
    end

    trait :finished do
      status { "finished" }
      started_at { 30.minutes.ago }
      finished_at { Time.current }
      water_used_liters { 5 }
    end
  end
end
