# spec/models/watering_schedule_spec.rb

require "rails_helper"

RSpec.describe WateringSchedule, type: :model do
  subject(:watering_schedule) { build(:watering_schedule) }

  describe "factory" do
    it "has a valid factory" do
      expect(watering_schedule).to be_valid
    end

    it "can build an active schedule" do
      expect(build(:watering_schedule, :active)).to be_valid
    end

    it "can build an inactive schedule" do
      expect(build(:watering_schedule, :inactive)).to be_valid
    end

    it "can build a sunday schedule" do
      expect(build(:watering_schedule, :sunday)).to be_valid
    end

    it "can build an evening schedule" do
      expect(build(:watering_schedule, :evening)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:day_of_week) }
    it { is_expected.to validate_inclusion_of(:day_of_week).in_range(0..6) }

    it { is_expected.to validate_presence_of(:start_time) }
    it { is_expected.to validate_presence_of(:end_time) }

    it { is_expected.to allow_value(true).for(:active) }
    it { is_expected.to allow_value(false).for(:active) }
    it { is_expected.not_to allow_value(nil).for(:active) }

    it "requires end time to be greater than start time" do
      schedule = build(
        :watering_schedule,
        start_time: Time.zone.parse("08:00"),
        end_time: Time.zone.parse("08:00")
      )

      expect(schedule).not_to be_valid
      expect(schedule.errors.details[:end_time]).to include(hash_including(error: :greater_than))
    end
  end
end
