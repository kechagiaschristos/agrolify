require "rails_helper"

RSpec.describe WateringLog, type: :model do
  subject(:watering_log) { build(:watering_log) }

  describe "factory" do
    it "has a valid factory" do
      expect(watering_log).to be_valid
    end

    it "can build a starting watering log" do
      expect(build(:watering_log, :starting)).to be_valid
    end

    it "can build a running watering log" do
      expect(build(:watering_log, :running)).to be_valid
    end

    it "can build a finished watering log" do
      expect(build(:watering_log, :finished)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:started_at) }
    it { is_expected.to validate_presence_of(:status) }

    it do
      is_expected.to define_enum_for(:status)
        .with_values(
          running: "running",
          starting: "starting",
          stopping: "stopping",
          finished: "finished"
        )
        .backed_by_column_of_type(:string)
    end

    it "requires finished_at when status is finished" do
      watering_log = build(:watering_log, :finished, finished_at: nil)

      expect(watering_log).not_to be_valid
      expect(watering_log.errors[:finished_at]).to include("can't be blank")
    end

    it "keeps water usage unknown when the device does not measure consumption" do
      watering_log = build(:watering_log, :finished, water_used_liters: nil)

      expect(watering_log).to be_valid
    end

    it "requires water_used_liters to be an integer when status is finished" do
      watering_log = build(:watering_log, :finished, water_used_liters: 1.5)

      expect(watering_log).not_to be_valid
      expect(watering_log.errors[:water_used_liters]).to include("must be an integer")
    end

    it "requires water_used_liters to be greater than or equal to zero when status is finished" do
      watering_log = build(:watering_log, :finished, water_used_liters: -1)

      expect(watering_log).not_to be_valid
      expect(watering_log.errors[:water_used_liters]).to include("must be greater than or equal to 0")
    end

    it "does not allow finished_at when status is not finished" do
      watering_log = build(:watering_log, :running, finished_at: Time.current)

      expect(watering_log).not_to be_valid
      expect(watering_log.errors[:finished_at]).to include("must be blank")
    end

    it "allows water_used_liters to be blank when status is not finished" do
      watering_log = build(:watering_log, :running, water_used_liters: nil)

      expect(watering_log).to be_valid
    end
  end
end
