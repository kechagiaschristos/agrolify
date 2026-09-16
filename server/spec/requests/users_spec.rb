require "rails_helper"

RSpec.describe "Profile", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  describe "GET /profile" do
    it "requires authentication" do
      get profile_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "returns the current user profile" do
      user = create(:user, first_name: "Jane", last_name: "Grower", email: "jane@example.com")

      sign_in(user)
      get profile_path

      expect(response).to have_http_status(:ok)
      expect(json_response["user"]["id"]).to eq(user.id)
      expect(json_response["user"]["first_name"]).to eq("Jane")
      expect(json_response["user"]["last_name"]).to eq("Grower")
      expect(json_response["user"]["email"]).to eq("jane@example.com")
    end

    it "returns PROFILE_FETCHED" do
      user = create(:user)

      sign_in(user)
      get profile_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("PROFILE_FETCHED")
    end
  end

  describe "PATCH /profile" do
    it "requires authentication" do
      patch profile_path, params: {
        user: {
          first_name: "Jane"
        }
      }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "updates valid profile fields" do
      user = create(:user)

      sign_in(user)
      patch profile_path, params: {
        user: {
          first_name: "Jane",
          last_name: "Grower",
          email: "JANE@EXAMPLE.COM",
          theme: "dark",
          locale: "el"
        }
      }

      user.reload

      expect(response).to have_http_status(:ok)
      expect(user.first_name).to eq("Jane")
      expect(user.last_name).to eq("Grower")
      expect(user.email).to eq("jane@example.com")
      expect(user.theme).to eq("dark")
      expect(user.locale).to eq("el")
    end

    it "returns PROFILE_UPDATED" do
      user = create(:user)

      sign_in(user)
      patch profile_path, params: {
        user: {
          first_name: "Jane"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("PROFILE_UPDATED")
      expect(json_response["user"]["first_name"]).to eq("Jane")
    end

    it "rejects invalid profile fields" do
      user = create(:user, first_name: "John", email: "john@example.com")

      sign_in(user)
      patch profile_path, params: {
        user: {
          first_name: "",
          email: "invalid-email",
          theme: ""
        }
      }

      user.reload

      expect(response).to have_http_status(:unprocessable_entity)
      expect(user.first_name).to eq("John")
      expect(user.email).to eq("john@example.com")
    end

    it "returns PROFILE_UPDATE_FAILED with validation errors" do
      user = create(:user)

      sign_in(user)
      patch profile_path, params: {
        user: {
          first_name: "",
          email: "invalid-email",
          theme: ""
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("PROFILE_UPDATE_FAILED")
      expect(json_response["errors"]).to include(
        "First name can't be blank",
        "Email is invalid",
        "Theme can't be blank"
      )
    end
  end

  describe "DELETE /profile" do
    it "requires authentication" do
      delete profile_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "deletes the current user" do
      user = create(:user)

      sign_in(user)
      delete profile_path

      expect(response).to have_http_status(:no_content)
      expect(User.exists?(user.id)).to be(false)
    end

    it "returns no content" do
      user = create(:user)

      sign_in(user)
      delete profile_path

      expect(response).to have_http_status(:no_content)
      expect(response.body).to be_blank
    end
  end
end
