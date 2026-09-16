require "rails_helper"

RSpec.describe Measurement, type: :model do
  subject(:measurement) { build(:measurement) }

  describe "factory" do
    it "has a valid factory" do
      expect(measurement).to be_valid
    end

    it "can build an empty measurement" do
      expect(build(:measurement, :empty)).to be_valid
    end

    it "can build hot measurements" do
      expect(build(:measurement, :hot)).to be_valid
    end

    it "can build dry measurements" do
      expect(build(:measurement, :dry)).to be_valid
    end

    it "can build low water measurements" do
      expect(build(:measurement, :low_water)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it do
      is_expected.to validate_numericality_of(:air_temperature_c)
                       .is_greater_than(-100)
                       .is_less_than(100)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:soil_temperature_c)
                       .is_greater_than(-100)
                       .is_less_than(100)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:air_humidity)
                       .is_greater_than_or_equal_to(0)
                       .is_less_than_or_equal_to(100)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:soil_moisture)
                       .is_greater_than_or_equal_to(0)
                       .is_less_than_or_equal_to(100)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:gps_latitude)
                       .is_greater_than_or_equal_to(-90)
                       .is_less_than_or_equal_to(90)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:gps_longitude)
                       .is_greater_than_or_equal_to(-180)
                       .is_less_than_or_equal_to(180)
                       .allow_nil
    end

    it do
      is_expected.to validate_numericality_of(:water_level_liters)
                       .is_greater_than_or_equal_to(0)
                       .allow_nil
    end
  end
end
