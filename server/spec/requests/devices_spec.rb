require "rails_helper"

RSpec.describe "Devices", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  describe "GET /devices" do
    it "requires authentication" do
      get devices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end
    it "returns only devices owned by the current user" do
      user = create(:user)
      other_user = create(:user)
      owned_device = create(:device, user: user)
      other_device = create(:device, user: other_user)

      sign_in(user)
      get devices_path

      device_codes = json_response["devices"].map { |device| device["code"] }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICES_FETCHED")
      expect(device_codes).to include(owned_device.code)
      expect(device_codes).not_to include(other_device.code)
    end

    it "does not return devices owned by another user" do
      user = create(:user)
      other_user = create(:user)

      create(:device, user: user)
      other_device = create(:device, user: other_user)
      sign_in(user)
      get devices_path

      device_codes = json_response["devices"].map { |device| device["code"] }
      expect(response).to have_http_status(:ok)
      expect(device_codes).not_to include(other_device.code)
    end

    it "returns DEVICES_FETCHED" do
      user = create(:user)
      create(:device, user: user)

      sign_in(user)

      get devices_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICES_FETCHED")
    end
  end

  describe "GET /devices/:code" do
    it "requires authentication" do
      device = create(:device)
      get device_path(device.code)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "returns an owned device" do
      user = create(:user)
      device = create(:device, user: user)
      sign_in(user)
      get device_path(device.code)
      expect(response).to have_http_status(:ok)
      expect(json_response["device"]["code"]).to eq(device.code)
      expect(json_response["device"]["name"]).to eq(device.name)
    end

    it "returns DEVICE_FETCHED" do
      user = create(:user)
      device = create(:device, user: user)
      sign_in(user)
      get device_path(device.code)
      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICE_FETCHED")
    end

    it "returns DEVICE_NOT_FOUND for an unknown code" do
      user = create(:user)
      sign_in(user)
      get device_path("unknown-code")
      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns DEVICE_NOT_FOUND for another user's device" do
      user = create(:user)
      other_user = create(:user)
      other_device = create(:device, user: other_user)

      sign_in(user)
      get device_path(other_device.code)
      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end
  end

  describe "POST /devices/:code/attach" do
    it "requires authentication" do
      device = create(:device, :without_user)
      post attach_device_path(device.code)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "attaches an unassigned device" do
      user = create(:user)
      device = create(:device, :without_user)
      sign_in(user)
      post attach_device_path(device.code)
      expect(response).to have_http_status(:ok)
      expect(device.reload.user).to eq(user)
    end

    it "returns DEVICE_ATTACHED" do
      user = create(:user)
      device = create(:device, :without_user)
      sign_in(user)
      post attach_device_path(device.code)
      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICE_ATTACHED")
    end

    it "returns DEVICE_ALREADY_ATTACHED when the device already belongs to the current user" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      post attach_device_path(device.code)

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICE_ALREADY_ATTACHED")
      expect(json_response["device"]["code"]).to eq(device.code)
    end

    it "returns DEVICE_ALREADY_ASSIGNED when the device belongs to another user" do
      user = create(:user)
      other_user = create(:user)
      device = create(:device, user: other_user)

      sign_in(user)

      post attach_device_path(device.code)

      expect(response).to have_http_status(:conflict)
      expect(json_response).to eq("code" => "DEVICE_ALREADY_ASSIGNED")
    end

    it "returns DEVICE_NOT_FOUND for an unknown code" do
      user = create(:user)

      sign_in(user)

      post attach_device_path("unknown-code")

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end
  end

  describe "PATCH /devices/:code" do
    it "requires authentication" do
      device = create(:device)

      patch device_path(device.code), params: {
        device: {
          name: "Updated Greenhouse"
        }
      }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "updates valid device settings" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      patch device_path(device.code), params: {
        device: {
          name: "Updated Greenhouse",
          description: "Updated description",
          temperature_air_min_c: 19,
          temperature_air_max_c: 29,
          ventilation_temperature_min_c: 21,
          ventilation_temperature_max_c: 27,
          water_tank_capacity_liters: 60,
          temperature_unit: "fah",
          liquid_unit: "gallons",
          time_zone: "Athens"
        }
      }

      device.reload

      expect(response).to have_http_status(:ok)
      expect(device.name).to eq("Updated Greenhouse")
      expect(device.description).to eq("Updated description")
      expect(device.temperature_air_min_c).to eq(19)
      expect(device.temperature_air_max_c).to eq(29)
      expect(device.ventilation_temperature_min_c).to eq(21)
      expect(device.ventilation_temperature_max_c).to eq(27)
      expect(device.water_tank_capacity_liters).to eq(60)
      expect(device.temperature_unit).to eq("fah")
      expect(device.liquid_unit).to eq("gallons")
      expect(device.time_zone).to eq("Athens")
    end

    it "returns DEVICE_UPDATED" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      patch device_path(device.code), params: {
        device: {
          name: "Updated Greenhouse"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICE_UPDATED")
      expect(json_response["device"]["name"]).to eq("Updated Greenhouse")
    end

    it "rejects blank device params" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      patch device_path(device.code), params: {
        device: {}
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("DEVICE_UPDATE_FAILED")
      expect(json_response["errors"]).to include("No device settings were provided")
    end

    it "rejects invalid device settings" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      patch device_path(device.code), params: {
        device: {
          name: "abc"
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns DEVICE_UPDATE_FAILED with validation errors" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      patch device_path(device.code), params: {
        device: {
          water_tank_capacity_liters: 0
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("DEVICE_UPDATE_FAILED")
      expect(json_response["errors"]).to be_present
    end

    it "returns DEVICE_NOT_FOUND for another user's device" do
      user = create(:user)
      other_user = create(:user)
      other_device = create(:device, user: other_user)

      sign_in(user)

      patch device_path(other_device.code), params: {
        device: {
          name: "Updated Greenhouse"
        }
      }

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end
  end

  describe "DELETE /devices/:code/detach" do
    it "requires authentication" do
      device = create(:device)

      delete detach_device_path(device.code)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "detaches an owned device" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      delete detach_device_path(device.code)

      expect(response).to have_http_status(:ok)
      expect(device.reload.user).to be_nil
    end

    it "clears selected_device_code when detaching the selected device" do
      user = create(:user)
      device = create(:device, user: user)
      user.update!(selected_device_code: device.code)

      sign_in(user)

      delete detach_device_path(device.code)

      expect(response).to have_http_status(:ok)
      expect(user.reload.selected_device_code).to be_nil
    end

    it "returns DEVICE_DETACHED" do
      user = create(:user)
      device = create(:device, user: user)

      sign_in(user)

      delete detach_device_path(device.code)

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("DEVICE_DETACHED")
      expect(json_response["device_code"]).to eq(device.code)
    end

    it "returns DEVICE_NOT_FOUND for an unknown code" do
      user = create(:user)

      sign_in(user)

      delete detach_device_path("unknown-code")

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns DEVICE_NOT_FOUND for another user's device" do
      user = create(:user)
      other_user = create(:user)
      other_device = create(:device, user: other_user)

      sign_in(user)

      delete detach_device_path(other_device.code)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end
  end
end
