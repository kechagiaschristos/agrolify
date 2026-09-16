class DeviceCommand < ApplicationRecord
  RETRY_INTERVAL = 20.seconds
  CONFIRMATION_TIMEOUT = 90.seconds
  KINDS = %w[fan.update window.update water_pump.update].freeze

  belongs_to :device
  belongs_to :watering_log, optional: true
  enum :status, { pending: "pending", confirmed: "confirmed", failed: "failed", superseded: "superseded" }
  validates :kind, inclusion: { in: KINDS }
  after_create_commit :enqueue_delivery
  after_commit :broadcast_control, on: %i[create update]

  # Call under the device lock so submissions, acknowledgements and retries serialize.
  def self.submit!(device:, kind:, parameters:, watering_log: nil, expires_at: CONFIRMATION_TIMEOUT.from_now)
    pending = device.device_commands.pending.find_by(kind: kind)
    return pending if pending && pending.parameters == parameters.stringify_keys

    pending&.update!(status: "superseded")
    device.device_commands.create!(kind:, parameters:, watering_log:, expires_at:)
  end

  def client_payload
    { id: id, status: status, error_code: error_code, updated_at: updated_at.iso8601(6) }
  end

  private

  def enqueue_delivery
    DeliverDeviceCommandJob.perform_later(id)
  end

  def broadcast_control
    case kind
    when "fan.update"
      fan = device.fan
      MeasurementsChannel.broadcast_to(device, { type: "fan.updated", fan: FanSerializer.new(fan).as_json }) if fan
    when "window.update"
      window = device.window
      MeasurementsChannel.broadcast_to(device, { type: "window.updated", window: WindowSerializer.new(window).as_json }) if window
    end
  end
end
