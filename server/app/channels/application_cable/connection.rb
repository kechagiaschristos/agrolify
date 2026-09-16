module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :current_device

    def connect
      user_token = cookies[AuthCookie::AUTH_COOKIE_NAME]
      device_token = request.params[:token].to_s

      self.current_user = find_user_from_token(user_token) if user_token.present?
      self.current_device = find_device_from_token(device_token) if device_token.present?

      reject_unauthorized_connection if current_user.blank? && current_device.blank?
    end

    private

    def find_user_from_token(token)
      payload = JsonWebToken.decode(token)
      User.find(payload[:user_id])
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError, ActiveRecord::RecordNotFound
      nil
    end

    def find_device_from_token(token)
      Device.find_by(token: token)
    end
  end
end
