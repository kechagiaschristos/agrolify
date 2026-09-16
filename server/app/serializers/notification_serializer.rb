class NotificationSerializer
  def initialize(notification)
    @notification = notification
  end

  def as_json(*)
    {
      id: @notification.id,
      kind: @notification.kind,
      title: @notification.title,
      message: @notification.message,
      device_name: @notification.device&.name,
      device_code: @notification.device&.code,
      is_read: @notification.read_at.present?,
      read_at: @notification.read_at&.iso8601,
      created_at: @notification.created_at&.iso8601,
      updated_at: @notification.updated_at&.iso8601
    }
  end
end
