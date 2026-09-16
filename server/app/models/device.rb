class Device < ApplicationRecord
  ONLINE_THRESHOLD = 90.seconds
  CONNECTION_TTL = 2.minutes

  enum :temperature_unit, { cel: "cel", fah: "fah" }, prefix: true
  enum :liquid_unit, { liters: "liters", gallons: "gallons" }, prefix: true

  before_validation :generate_name, on: :create
  before_validation :generate_code, on: :create
  before_validation :generate_token, on: :create


  belongs_to :user, inverse_of: :devices, optional: true
  has_many :measurements, inverse_of: :device, dependent: :destroy
  has_many :notifications, inverse_of: :device, dependent: :destroy
  has_many :watering_logs, inverse_of: :device, dependent: :destroy
  has_many :watering_schedules, inverse_of: :device, dependent: :destroy
  has_one :fan, inverse_of: :device, dependent: :destroy
  has_one :window, inverse_of: :device, dependent: :destroy
  has_many :device_commands, dependent: :destroy


  validates :name, presence: true, length: { minimum: 4 }
  validates :code, presence: true, length: { minimum: 5 }
  validates :description, length: { maximum: 200 }
  validates :temperature_air_min_c, :temperature_air_max_c,
            :ventilation_temperature_min_c, :ventilation_temperature_max_c,
            :water_tank_capacity_liters,
            presence: true,
            numericality: { only_integer: true }
  validates :temperature_air_max_c,
            comparison: { greater_than: :temperature_air_min_c }
  validates :ventilation_temperature_max_c,
            comparison: { greater_than: :ventilation_temperature_min_c }
  validates :water_tank_capacity_liters,
            numericality: { only_integer: true, greater_than: 0 }
  validates :temperature_unit, presence: true
  validates :liquid_unit, presence: true
  validates :time_zone, presence: true
  validate :time_zone_must_be_supported
  validates :token, presence: true, uniqueness: true, length: { minimum: 16 }

  def online?
    last_seen_at.present? && last_seen_at >= ONLINE_THRESHOLD.ago
  end

  def connected?
    self.class.where(id: id).where("connected_until > ?", Time.current).exists?
  end

  def reachable?
    connected? || online?
  end

  def mark_seen!
    update_column(:last_seen_at, Time.current)
  end

  def mark_connected!(token = nil)
    if token
      self.class.where(id: id, connection_token: token).update_all(connected_until: CONNECTION_TTL.from_now) == 1
    else
      update_columns(connection_token: SecureRandom.uuid, connected_until: CONNECTION_TTL.from_now)
      connection_token
    end
  end

  def mark_disconnected!(token = connection_token)
    self.class.where(id: id, connection_token: token).update_all(connected_until: nil)
  end

  def schedule_time_zone
    ActiveSupport::TimeZone[time_zone] || Time.zone
  end

  private

  def generate_name
    return if name.present?
    self.name = SecureRandom.hex(4)
  end

  def generate_code
    return if code.present?
    self.code = SecureRandom.hex(5)
  end


  def generate_token
    return if token.present?
    self.token = SecureRandom.hex(16)
  end

  def time_zone_must_be_supported
    return if time_zone.blank?
    return if ActiveSupport::TimeZone[time_zone].present?

    errors.add(:time_zone, "is not supported")
  end
end
