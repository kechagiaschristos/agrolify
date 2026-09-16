require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "assigns a default avatar on create" do
    user = User.create!(
      first_name: "Chris",
      last_name: "Papas",
      email: "chris@example.com",
      password: "password123",
      password_confirmation: "password123"
    )

    assert_equal "avatar-capsule.png", user.avatar
  end
end
