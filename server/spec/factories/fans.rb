# spec/factories/fans.rb

FactoryBot.define do
  factory :fan do
    association :device

    status { "off" }
    mode { "manual" }

    trait :on do
      status { "on" }
    end

    trait :off do
      status { "off" }
    end

    trait :auto do
      mode { "auto" }
    end

    trait :manual do
      mode { "manual" }
    end
  end
end
