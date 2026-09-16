require "rails_helper"

RSpec.describe Device, type: :model do
  subject(:device) { build(:device) }

  describe "factory" do
    it "has a valid factory" do
      expect(device).to be_valid
    end

    it "can create multiple devices" do
      expect { create_list(:device, 2) }.to change(described_class, :count).by(2)
    end

    it "can build a device without a user" do
      expect(build(:device, :without_user)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user).optional }
    it { is_expected.to have_many(:measurements).dependent(:destroy) }
    it { is_expected.to have_many(:notifications).dependent(:destroy) }
    it { is_expected.to have_many(:watering_logs).dependent(:destroy) }
    it { is_expected.to have_many(:watering_schedules).dependent(:destroy) }
    it { is_expected.to have_one(:fan).dependent(:destroy) }
    it { is_expected.to have_one(:window).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_length_of(:name).is_at_least(4) }
    it { is_expected.to validate_length_of(:code).is_at_least(5) }
    it { is_expected.to validate_length_of(:description).is_at_most(200) }

    it { is_expected.to validate_presence_of(:temperature_air_min_c) }
    it { is_expected.to validate_presence_of(:temperature_air_max_c) }
    it { is_expected.to validate_presence_of(:ventilation_temperature_min_c) }
    it { is_expected.to validate_presence_of(:ventilation_temperature_max_c) }
    it { is_expected.to validate_presence_of(:water_tank_capacity_liters) }

    it { is_expected.to validate_numericality_of(:temperature_air_min_c).only_integer }
    it { is_expected.to validate_numericality_of(:temperature_air_max_c).only_integer }
    it { is_expected.to validate_numericality_of(:ventilation_temperature_min_c).only_integer }
    it { is_expected.to validate_numericality_of(:ventilation_temperature_max_c).only_integer }
    it { is_expected.to validate_numericality_of(:water_tank_capacity_liters).only_integer.is_greater_than(0) }

    it { is_expected.to validate_presence_of(:temperature_unit) }
    it { is_expected.to validate_presence_of(:liquid_unit) }
    it { is_expected.to validate_presence_of(:time_zone) }

    it { is_expected.to validate_uniqueness_of(:token) }
    it { is_expected.to validate_length_of(:token).is_at_least(16) }

    it "requires a token after creation" do
      device = create(:device)

      device.token = nil

      expect(device).not_to be_valid
      expect(device.errors[:token]).to include("can't be blank")
    end

    it "requires air max temperature to be greater than air min temperature" do
      device = build(:device, temperature_air_min_c: 20, temperature_air_max_c: 20)

      expect(device).not_to be_valid
      expect(device.errors[:temperature_air_max_c]).to include("must be greater than 20")
    end

    it "requires ventilation max temperature to be greater than ventilation min temperature" do
      device = build(:device, ventilation_temperature_min_c: 22, ventilation_temperature_max_c: 22)

      expect(device).not_to be_valid
      expect(device.errors[:ventilation_temperature_max_c]).to include("must be greater than 22")
    end

    it "requires a supported time zone" do
      device = build(:device, time_zone: "Invalid/Zone")

      expect(device).not_to be_valid
      expect(device.errors[:time_zone]).to include("is not supported")
    end
  end

  describe "callbacks" do
    it "generates a name when name is blank" do
      device = build(:device, name: nil)
      device.valid?
      expect(device.name).to be_present
    end

    it "generates a code when code is blank" do
      device = build(:device, code: nil)

      device.valid?

      expect(device.code).to be_present
    end

    it "generates a token when token is blank" do
      device = build(:device, token: nil)

      device.valid?

      expect(device.token).to be_present
    end

    it "keeps the provided name" do
      device = create(:device, name: "Greenhouse Main")

      expect(device.name).to eq("Greenhouse Main")
    end

    it "keeps the provided code" do
      device = create(:device, code: "MAIN1")

      expect(device.code).to eq("MAIN1")
    end

    it "keeps the provided token" do
      device = create(:device, token: "custom-device-token")

      expect(device.token).to eq("custom-device-token")
    end
  end

  describe "#online?" do
    it "is true when last seen within the online threshold" do
      device = build(:device, :online)

      expect(device).to be_online
    end

    it "is false when last seen is older than the online threshold" do
      device = build(:device, :offline)

      expect(device).not_to be_online
    end

    it "is false when never seen" do
      device = build(:device, :never_seen)
      expect(device).not_to be_online
    end
  end

  describe "connection state" do
    let(:cache_store) { ActiveSupport::Cache::MemoryStore.new }

    before do
      allow(Rails).to receive(:cache).and_return(cache_store)
    end

    describe "#connected?" do
      it "is true after the device is marked connected" do
        device = create(:device)

        device.mark_connected!

        expect(device).to be_connected
      end

      it "is false when the device has not been marked connected" do
        device = create(:device)

        expect(device).not_to be_connected
      end
    end

    describe "#reachable?" do
      it "is true when the device is connected" do
        device = create(:device, :never_seen)

        device.mark_connected!

        expect(device).to be_reachable
      end

      it "is true when the device is online" do
        device = build(:device, :online)

        expect(device).to be_reachable
      end

      it "is false when the device is neither connected nor online" do
        device = create(:device, :never_seen)

        expect(device).not_to be_reachable
      end
    end

    describe "#mark_disconnected!" do
      it "marks the device as disconnected" do
        device = create(:device)
        device.mark_connected!

        device.mark_disconnected!

        expect(device).not_to be_connected
      end
    end
  end

  describe "#mark_seen!" do
    it "updates last_seen_at" do
      device = create(:device, :never_seen)

      expect { device.mark_seen! }.to change { device.reload.last_seen_at }.from(nil)
    end
  end

  describe "#schedule_time_zone" do
    it "returns the configured time zone" do
      device = build(:device, time_zone: "Athens")

      expect(device.schedule_time_zone.name).to eq("Athens")
    end

    it "falls back to the Rails time zone when the configured time zone is invalid" do
      device = build(:device, time_zone: "Invalid/Zone")

      expect(device.schedule_time_zone).to eq(Time.zone)
    end
  end
end
