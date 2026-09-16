class User < ApplicationRecord
  DEFAULT_AVATAR = "avatar-capsule.png".freeze

  THEMES = {
    light: "light",
    dark: "dark"
  }.freeze
  LOCALES = {
    en: "en",
    el: "el"
  }.freeze

  enum :theme, THEMES, prefix: true
  enum :locale, LOCALES, prefix: true

  has_secure_password
  has_many :devices, inverse_of: :user
  has_many :notifications, inverse_of: :user, dependent: :destroy

  before_validation :normalize_email
  before_validation :generate_username, on: :create
  before_validation :assign_default_avatar, on: :create

  validates :first_name, :last_name, presence: true, length: { minimum: 3 }
  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :email,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, allow_nil: true
  validates :theme, presence: true
  validates :locale, presence: true
  validates :selected_device_code, length: { minimum: 5 }, allow_blank: true

  private

  def generate_username
    return if username.present?

    base_part = "#{first_name.to_s.first}#{last_name.to_s.first}".downcase
    random_part = SecureRandom.hex(3)
    self.username = "#{base_part}#{random_part}"
  end

  def normalize_email
    self.email = email.to_s.strip.downcase
  end

  def assign_default_avatar
    self.avatar = DEFAULT_AVATAR if avatar.blank?
  end
end
