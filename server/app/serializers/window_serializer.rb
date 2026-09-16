class WindowSerializer
  def initialize(window)
    @window = window
  end

  def as_json(*)
    {
      id: @window.id,
      device_id: @window.device_id,
      left_window_status: @window.left_window_status,
      right_window_status: @window.right_window_status,
      command: @window.device.device_commands.where(kind: "window.update").order(created_at: :desc).first&.client_payload,
      created_at: @window.created_at&.iso8601,
      updated_at: @window.updated_at&.iso8601
    }
  end
end
