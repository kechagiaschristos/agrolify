require "rails_helper"

RSpec.describe Fan, type: :model do
  subject(:fan) { build(:fan) }

  it "broadcasts confirmed state and mode changes to the device's subscribers" do
    record = create(:fan)
    allow(MeasurementsChannel).to receive(:broadcast_to)

    record.update!(status: "on", mode: "auto")

    expect(MeasurementsChannel).to have_received(:broadcast_to).with(
      record.device,
      { type: "fan.updated", fan: hash_including(device_id: record.device_id, status: "on", mode: "auto") }
    )
  end

  describe "factory" do
    it "has a valid factory" do
      expect(fan).to be_valid
    end

    it "can build an on fan" do
      expect(build(:fan, :on)).to be_valid
    end

    it "can build an auto fan" do
      expect(build(:fan, :auto)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_presence_of(:mode) }
  end

  describe "enums" do
    it do
      expect(fan).to define_enum_for(:status)
                       .with_values(on: "on", off: "off")
                       .backed_by_column_of_type(:string)
                       .with_prefix
    end

    it do
      expect(fan).to define_enum_for(:mode)
                       .with_values(manual: "manual", auto: "auto")
                       .backed_by_column_of_type(:string)
                       .with_prefix
    end
  end

  describe ".valid_status?" do
    it "returns true for a valid status" do
      expect(described_class.valid_status?("on")).to be(true)
    end

    it "returns false for an invalid status" do
      expect(described_class.valid_status?("broken")).to be(false)
    end
  end

  describe ".valid_mode?" do
    it "returns true for a valid mode" do
      expect(described_class.valid_mode?("auto")).to be(true)
    end

    it "returns false for an invalid mode" do
      expect(described_class.valid_mode?("broken")).to be(false)
    end
  end
end
