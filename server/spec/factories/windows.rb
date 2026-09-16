# spec/factories/windows.rb

FactoryBot.define do
  factory :window do
    association :device
    left_window_status { "closed" }
    right_window_status { "closed" }

    trait :open do
      left_window_status { "open" }
      right_window_status { "open" }
    end

    trait :left_open do
      left_window_status { "open" }
    end

    trait :right_open do
      right_window_status { "open" }
    end
  end
end
