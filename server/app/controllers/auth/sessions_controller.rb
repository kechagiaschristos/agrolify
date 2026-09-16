module Auth
  class SessionsController < ApplicationController
    include AuthCookie

    def create
      email = user_params[:email].to_s.strip.downcase
      user = User.find_by(email: email)

      if user&.authenticate(user_params[:password])
        token = JsonWebToken.encode({ user_id: user.id })
        set_auth_cookie(token)
        render json: {
          code: "LOGIN_SUCCEEDED"
        }, status: :ok
      else
        render json: {
          code: "INVALID_CREDENTIALS"
        }, status: :unauthorized
      end
    end

    def destroy
      clear_auth_cookie
      head :no_content
    end

    private

    def user_params
      params.require(:user).permit(:email, :password)
    end
  end
end
