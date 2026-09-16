require "rails_helper"

RSpec.describe "Registrations", type: :request do

  def json_response
    JSON.parse(response.body)
  end

  def valid_params
    {
      user: {
        first_name: "Jane",
        last_name: "Grower",
        email: "jane@example.com",
        password: "password",
        password_confirmation: "password"
      }
    }
  end

  describe "POST /auth/register" do
    it "creates a user with valid params" do
      post auth_register_path, params: valid_params
      user = User.last
      expect(response).to have_http_status(:created)
      expect(user.first_name).to eq("Jane")
      expect(user.last_name).to eq("Grower")
      expect(user.email).to eq("jane@example.com")
    end

    it "returns REGISTRATION_SUCCEEDED" do
      post auth_register_path, params: valid_params
      expect(response).to have_http_status(:created)
      expect(json_response).to eq("code" => "REGISTRATION_SUCCEEDED")
    end

    it "sets the auth cookie" do
      post auth_register_path, params: valid_params
      token = cookies[:auth_token]
      expect(response).to have_http_status(:created)
      expect(token).to be_present
      expect(JsonWebToken.decode(token)[:user_id]).to eq(User.last.id)
    end

    it "rejects invalid params" do
      post auth_register_path, params: {
        user: {
          first_name: "",
          last_name: "",
          email: "invalid-email",
          password: "short",
          password_confirmation: "different"
        }
      }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns REGISTRATION_FAILED with validation errors" do
      post auth_register_path, params: {
        user: {
          first_name: "",
          last_name: "",
          email: "invalid-email",
          password: "short",
          password_confirmation: "different"
        }
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("REGISTRATION_FAILED")
      expect(json_response["errors"]).to include(
                                           "First name can't be blank",
                                           "Last name can't be blank",
                                           "Email is invalid",
                                           "Password is too short (minimum is 6 characters)",
                                           "Password confirmation doesn't match Password"
                                         )
    end
  end
end
