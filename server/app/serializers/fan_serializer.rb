class FanSerializer
  def initialize(fan)
    @fan = fan
  end

  def as_json(*)
    {
      id: @fan.id,
      device_id: @fan.device_id,
      status: @fan.status,
      mode: @fan.mode,
      command: @fan.device.device_commands.where(kind: "fan.update").order(created_at: :desc).first&.client_payload,
      created_at: @fan.created_at&.iso8601,
      updated_at: @fan.updated_at&.iso8601
    }
  end
end
