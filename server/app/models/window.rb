class Window < ApplicationRecord
  WINDOW_STATUSES = {
    closing: "closing",
    opening: "opening",
    closed: "closed",
    open: "open"
  }.freeze
  STATUS_ATTRIBUTES = %i[left_window_status right_window_status].freeze

  enum :left_window_status, WINDOW_STATUSES, prefix: true
  enum :right_window_status, WINDOW_STATUSES, prefix: true

  belongs_to :device, inverse_of: :window

  after_update_commit :broadcast_state, if: -> { STATUS_ATTRIBUTES.any? { |attribute| saved_change_to_attribute?(attribute) } }

  validates :left_window_status, :right_window_status,
            presence: true

  def self.valid_status?(status)
    left_window_statuses.value?(status.to_s)
  end

  private

  def broadcast_state
    MeasurementsChannel.broadcast_to(device, { type: "window.updated", window: WindowSerializer.new(self).as_json })
  end
end
