class NotificationsChannel < ApplicationCable::Channel
  DEFAULT_LIMIT = 10

  def subscribed
    reject unless current_user.present?

    stream_for current_user
    transmit(notification_snapshot_payload)
  end

  private

  def notification_snapshot_payload
    notifications = current_user.notifications.order(created_at: :desc)

    {
      type: "notifications.snapshot",
      notifications: notifications.limit(DEFAULT_LIMIT).map(&:client_payload),
      total: notifications.count,
      unread_total: notifications.where(read_at: nil).count,
      page: 1,
      limit: DEFAULT_LIMIT
    }
  end
end
