module Auth
  class RegistrationsController < ApplicationController
    include AuthCookie

    def create
      user = User.new(user_params)
      if user.save
        token = JsonWebToken.encode({ user_id: user.id })
        set_auth_cookie(token)
        render json: {
          code: "REGISTRATION_SUCCEEDED"
        }, status: :created
      else
        render json: {
          code: "REGISTRATION_FAILED",
          errors: user.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    private

    def user_params
      params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation)
    end
  end
end
