class UsersController < BaseController
  def show
    render json: {
      code: "PROFILE_FETCHED",
      user: UserSerializer.new(current_user)
    }, status: :ok
  end

  def update
    if current_user.update(user_params)
      render json: {
        code: "PROFILE_UPDATED",
        user: UserSerializer.new(current_user)
      }, status: :ok
    else
      render json: {
        code: "PROFILE_UPDATE_FAILED",
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def destroy
    current_user.destroy!
    head :no_content
  end

  private

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :avatar,
      :password,
      :password_confirmation,
      :selected_device_code,
      :theme,
      :locale
    )
  end
end
