module Devices
  class NotificationsController < BaseController
    PAGE_LIMIT = 10

    def index
      page = [ params[:page].to_i, 1 ].max
      notifications = notifications_scope.includes(:device).order(created_at: :desc)
      paginated_notifications = notifications.offset((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT)

      render json: {
        code: "NOTIFICATIONS_FETCHED",
        notifications: paginated_notifications.map { |notification| NotificationSerializer.new(notification) },
        **notification_totals,
        page: page,
        limit: PAGE_LIMIT
      }, status: :ok
    end

    def update
      notification = find_notification
      return render_notification_not_found unless notification

      notification.update!(read_at: Time.current)

      render json: {
        code: "NOTIFICATION_UPDATED",
        notification: NotificationSerializer.new(notification),
        **notification_totals
      }, status: :ok
    end

    def destroy
      notification = find_notification
      return render_notification_not_found unless notification

      notification.destroy!

      render json: {
        code: "NOTIFICATION_DELETED",
        notification_id: notification.id,
        **notification_totals
      }, status: :ok
    end

    private

    def notifications_scope
      current_user.notifications
    end

    def find_notification
      notifications_scope.find_by(id: params[:id])
    end

    def notification_totals
      {
        total: notifications_scope.count,
        unread_total: notifications_scope.where(read_at: nil).count
      }
    end

    def render_notification_not_found
      render json: { code: "NOTIFICATION_NOT_FOUND" }, status: :not_found
    end
  end
end
