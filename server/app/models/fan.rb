class Fan < ApplicationRecord
  STATUSES = {
    on: "on",
    off: "off"
  }.freeze

  MODES = {
    manual: "manual",
    auto: "auto"
  }.freeze

  enum :status, STATUSES, prefix: true
  enum :mode, MODES, prefix: true

  belongs_to :device, inverse_of: :fan

  after_update_commit :broadcast_state, if: -> { saved_change_to_status? || saved_change_to_mode? }

  validates :status, :mode, presence: true

  def self.valid_status?(status)
    statuses.value?(status.to_s)
  end

  def self.valid_mode?(mode)
    modes.value?(mode.to_s)
  end

  private

  def broadcast_state
    MeasurementsChannel.broadcast_to(device, { type: "fan.updated", fan: FanSerializer.new(self).as_json })
  end
end
