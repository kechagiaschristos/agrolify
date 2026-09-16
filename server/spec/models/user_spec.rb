require "rails_helper"

RSpec.describe User, type: :model do
  describe 'factory' do
    it "has a valid factory" do
      expect(build(:user)).to be_valid
    end
  end

  describe "enums" do
    it "defines theme values" do
      expect(described_class.themes).to include(
        "light" => "light",
        "dark" => "dark"
      )
    end

    it "defines locale values" do
      expect(described_class.locales).to include(
        "en" => "en",
        "el" => "el"
      )
    end
  end

  describe "validations" do
    it "requires a first name" do
      user = build(:user, first_name: nil)

      expect(user).not_to be_valid
      expect(user.errors[:first_name]).to include("can't be blank")
    end

    it "requires first name to be at least 3 characters" do
      user = build(:user, first_name: "Jo")

      expect(user).not_to be_valid
      expect(user.errors[:first_name]).to include("is too short (minimum is 3 characters)")
    end

    it "requires a last name" do
      user = build(:user, last_name: nil)

      expect(user).not_to be_valid
      expect(user.errors[:last_name]).to include("can't be blank")
    end

    it "requires last name to be at least 3 characters" do
      user = build(:user, last_name: "Do")

      expect(user).not_to be_valid
      expect(user.errors[:last_name]).to include("is too short (minimum is 3 characters)")
    end

    it "requires a username" do
      user = create(:user)
      user.username = nil
      user.validate
      expect(user.errors[:username]).to include("can't be blank")
    end

    it "requires username to be unique" do
      create(:user, username: "JD1234")
      user = build(:user, username: "jd1234")

      expect(user).not_to be_valid
      expect(user.errors[:username]).to include("has already been taken")
    end

    it "requires an email" do
      user = build(:user, email: nil)

      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it "requires email to be valid" do
      user = build(:user, email: "invalid-email")

      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("is invalid")
    end

    it "requires email to be unique case-insensitively" do
      create(:user, email: "john@example.com")
      user = build(:user, email: "JOHN@example.com")

      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("has already been taken")
    end

    it "requires password to be at least 6 characters" do
      user = build(:user, password: "short")

      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("is too short (minimum is 6 characters)")
    end

    it "requires a theme" do
      user = build(:user, theme: nil)

      expect(user).not_to be_valid
      expect(user.errors[:theme]).to include("can't be blank")
    end

    it "requires a locale" do
      user = build(:user, locale: nil)

      expect(user).not_to be_valid
      expect(user.errors[:locale]).to include("can't be blank")
    end

    it "requires selected device code to be at least 5 characters when present" do
      user = build(:user, selected_device_code: "abcd")

      expect(user).not_to be_valid
      expect(user.errors[:selected_device_code]).to include("is too short (minimum is 5 characters)")
    end

    it "allows selected device code to be blank" do
      user = build(:user, selected_device_code: nil)

      expect(user).to be_valid
    end
  end

  describe "callbacks" do
    it "normalizes email before validation" do
      user = build(:user, email: "  JOHN@EXAMPLE.COM  ")
      user.validate
      expect(user.email).to eq("john@example.com")
    end

    it "generates a username on create when username is blank" do
      user = create(:user, first_name: "John", last_name: "Doe", username: nil)
      expect(user.username).to match(/\Ajd[0-9a-f]{6}\z/)
    end

    it "keeps the provided username" do
      user = create(:user, username: "john_doe")
      expect(user.username).to eq("john_doe")
    end

    it "assigns the default avatar on create when avatar is blank" do
      user = create(:user, avatar: nil)
      expect(user.avatar).to eq(User::DEFAULT_AVATAR)
    end

    it "keeps the provided avatar" do
      user = create(:user, avatar: "custom-avatar.png")
      expect(user.avatar).to eq("custom-avatar.png")
    end
  end

  describe "associations" do
    it "has many devices" do
      association = described_class.reflect_on_association(:devices)
      expect(association.macro).to eq(:has_many)
      expect(association.inverse_of.name).to eq(:user)
    end

    it "has many notifications" do
      association = described_class.reflect_on_association(:notifications)

      expect(association.macro).to eq(:has_many)
      expect(association.inverse_of.name).to eq(:user)
      expect(association.options[:dependent]).to eq(:destroy)
    end

    it "destroys dependent notifications when destroyed" do
      user = create(:user)
      device = Device.create!(
        name: "Main device",
        code: "ABCDE",
        token: SecureRandom.hex(16)
      )
      notification = Notification.create!(
        user: user,
        device: device,
        kind: "device_alert",
        title: "Water level low",
        message: "The water tank needs refilling."
      )
      expect { user.destroy }.to change(Notification, :count).by(-1)
      expect(Notification.exists?(notification.id)).to be(false)
    end
  end

end
