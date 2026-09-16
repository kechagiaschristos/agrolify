# spec/models/window_spec.rb

require "rails_helper"

RSpec.describe Window, type: :model do
  subject(:window) { build(:window) }

  it "broadcasts confirmed window state to the device's subscribers" do
    record = create(:window)
    allow(MeasurementsChannel).to receive(:broadcast_to)

    record.update!(left_window_status: "open")

    expect(MeasurementsChannel).to have_received(:broadcast_to).with(
      record.device,
      { type: "window.updated", window: hash_including(device_id: record.device_id, left_window_status: "open") }
    )
  end

  describe "factory" do
    it "has a valid factory" do
      expect(window).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:left_window_status) }
    it { is_expected.to validate_presence_of(:right_window_status) }
  end

  describe "enums" do
    it do
      expect(window).to define_enum_for(:left_window_status)
                          .with_values(
                            closing: "closing",
                            opening: "opening",
                            closed: "closed",
                            open: "open"
                          )
                          .backed_by_column_of_type(:string)
                          .with_prefix
    end

    it do
      expect(window).to define_enum_for(:right_window_status)
                          .with_values(
                            closing: "closing",
                            opening: "opening",
                            closed: "closed",
                            open: "open"
                          )
                          .backed_by_column_of_type(:string)
                          .with_prefix
    end
  end
end
