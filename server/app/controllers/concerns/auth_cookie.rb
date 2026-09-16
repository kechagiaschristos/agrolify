module AuthCookie
  include ActionController::Cookies

  AUTH_COOKIE_NAME = :auth_token

  private

  def auth_cookie_token
    cookies[AUTH_COOKIE_NAME]
  end

  def set_auth_cookie(token)
    cookies[AUTH_COOKIE_NAME] = {
      value: token,
      expires: 24.hours.from_now,
      httponly: true,
      same_site: :lax,
      secure: Rails.env.production?,
      domain: ENV["AUTH_COOKIE_DOMAIN"].presence
    }
  end

  def clear_auth_cookie
    cookies.delete(
      AUTH_COOKIE_NAME,
      domain: ENV["AUTH_COOKIE_DOMAIN"].presence
    )
  end
end
