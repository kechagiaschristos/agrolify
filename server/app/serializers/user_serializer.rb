class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: @user.id,
      first_name: @user.first_name,
      last_name: @user.last_name,
      username: @user.username,
      email: @user.email,
      avatar: @user.avatar,
      selected_device_code: @user.selected_device_code,
      theme: @user.theme,
      locale: @user.locale
    }
  end
end
