module Devices
  module Notifications
    class Create
      def self.call(device:, kind:, title:, message:)
        new(device:, kind:, title:, message:).call
      end

      def initialize(device:, kind:, title:, message:)
        @device = device
        @kind = kind
        @title = title
        @message = message
      end

      def call
        return unless @device.user.present?

        notification = Notification.create!(
          user: @device.user,
          device: @device,
          kind: @kind,
          title: @title,
          message: @message
        )

        NotificationsChannel.broadcast_to(@device.user, {
          type: "notification.created",
          notification: notification.client_payload,
          total: @device.user.notifications.count,
          unread_total: @device.user.notifications.where(read_at: nil).count
        })

        notification
      end
    end
  end
end
