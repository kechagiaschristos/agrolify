require "rails_helper"

RSpec.describe "Protected requests", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  describe "authentication" do
    it "returns unauthorized when auth cookie is missing" do
      get profile_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "returns unauthorized when auth token is invalid" do
      cookies[:auth_token] = "invalid-token"

      get profile_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "returns unauthorized when auth token belongs to a missing user" do
      cookies[:auth_token] = JsonWebToken.encode(user_id: SecureRandom.uuid)

      get profile_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "allows the request when auth token belongs to an existing user" do
      user = create(:user)
      cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)

      get profile_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("PROFILE_FETCHED")
    end
  end
end
