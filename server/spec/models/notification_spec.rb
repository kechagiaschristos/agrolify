require "rails_helper"

RSpec.describe Notification, type: :model do
  subject(:notification) { build(:notification) }

  describe "factory" do
    it "has a valid factory" do
      expect(notification).to be_valid
    end

    it "can build a read notification" do
      expect(build(:notification, :read)).to be_valid
    end

    it "can build an unread notification" do
      expect(build(:notification, :unread)).to be_valid
    end

    it "can build a water tank alert" do
      expect(build(:notification, :water_tank_alert)).to be_valid
    end

    it "creates the notification device for the same user" do
      notification = build(:notification)

      expect(notification.device.user).to eq(notification.user)
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:device) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:kind) }
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:message) }
  end

  describe "#client_payload" do
    it "includes notification fields plus device and read metadata" do
      notification = create(:notification, :read)

      payload = notification.client_payload

      expect(payload).to include(
        "id" => notification.id,
        "kind" => notification.kind,
        "title" => notification.title,
        "message" => notification.message,
        "device_name" => notification.device.name,
        "device_code" => notification.device.code,
        "is_read" => true,
        "created_at" => notification.created_at.iso8601,
        "read_at" => notification.read_at.iso8601
      )
    end

    it "marks unread notifications as unread in the payload" do
      notification = create(:notification, :unread)

      payload = notification.client_payload

      expect(payload["is_read"]).to be(false)
      expect(payload["read_at"]).to be_nil
    end
  end
end
