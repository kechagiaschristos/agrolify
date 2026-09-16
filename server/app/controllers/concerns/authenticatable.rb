module Authenticatable
  extend ActiveSupport::Concern
  include AuthCookie

  included do
    before_action :authenticate_request
  end

  private

  def current_user
    @current_user
  end

  def current_device
    return @current_device if defined?(@current_device)

    selected_code = current_user.selected_device_code
    @current_device = selected_code.present? ? current_user.devices.find_by(code: selected_code) : nil
  end

  def render_device_not_found
    render json: { code: "DEVICE_NOT_FOUND" }, status: :not_found
  end

  def render_device_offline
    render json: { code: "DEVICE_OFFLINE" }, status: :service_unavailable
  end

  def authenticate_request
    token = auth_cookie_token
    return render_unauthorized if token.blank?

    @current_user = User.find(JsonWebToken.decode(token)[:user_id])
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError, ActiveRecord::RecordNotFound
    render_unauthorized
  end

  def render_unauthorized
    render json: { code: "AUTH_UNAUTHORIZED" }, status: :unauthorized
  end
end
