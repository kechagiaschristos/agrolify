require "rails_helper"

RSpec.describe "Sessions", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  describe "POST /auth/login" do
    let!(:user) do
      create(:user, email: "grower@example.com", password: "password")
    end

    def login_params(email:, password:)
      {
        user: {
          email: email,
          password: password
        }
      }
    end

    it "logs in with valid credentials" do
      post auth_login_path, params: login_params(
        email: "grower@example.com",
        password: "password"
      )

      expect(response).to have_http_status(:ok)
    end

    it "normalizes email casing and whitespace" do
      post auth_login_path, params: login_params(
        email: "  GROWER@EXAMPLE.COM  ",
        password: "password"
      )

      expect(response).to have_http_status(:ok)
    end

    it "returns LOGIN_SUCCEEDED" do
      post auth_login_path, params: login_params(
        email: "grower@example.com",
        password: "password"
      )

      expect(response).to have_http_status(:ok)
      expect(json_response).to eq("code" => "LOGIN_SUCCEEDED")
    end

    it "sets the auth cookie" do
      post auth_login_path, params: login_params(
        email: "grower@example.com",
        password: "password"
      )

      token = response.cookies["auth_token"]

      expect(response).to have_http_status(:ok)
      expect(token).to be_present
      expect(JsonWebToken.decode(token)[:user_id]).to eq(user.id)
    end

    it "rejects an incorrect password" do
      post auth_login_path, params: login_params(
        email: "grower@example.com",
        password: "wrong-password"
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an unknown email" do
      post auth_login_path, params: login_params(
        email: "missing@example.com",
        password: "password"
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns INVALID_CREDENTIALS" do
      post auth_login_path, params: login_params(
        email: "grower@example.com",
        password: "wrong-password"
      )

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "INVALID_CREDENTIALS")
    end
  end

  describe "DELETE /auth/logout" do
    it "clears the auth cookie" do
      cookies[:auth_token] = "existing-token"

      delete auth_logout_path

      expect(cookies[:auth_token]).to be_blank
    end

    it "returns no content" do
      delete auth_logout_path

      expect(response).to have_http_status(:no_content)
      expect(response.body).to be_blank
    end
  end
end
