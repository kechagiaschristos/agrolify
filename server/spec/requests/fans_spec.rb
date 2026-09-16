require "rails_helper"

RSpec.describe "Fan", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  def select_device(user, device)
    user.update!(selected_device_code: device.code)
  end

  describe "GET /fan" do
    it "uses the explicitly requested owned device instead of the saved selection" do
      user = create(:user)
      selected_device = create(:device, user: user)
      requested_device = create(:device, user: user)
      fan = create(:fan, device: requested_device)
      select_device(user, selected_device)
      sign_in(user)

      get fan_path, params: { device_code: requested_device.code }

      expect(response).to have_http_status(:ok)
      expect(json_response["fan"]["id"]).to eq(fan.id)
    end

    it "does not allow an explicit device code to access another user's device" do
      user = create(:user)
      own_device = create(:device, user: user)
      other_device = create(:device, user: create(:user))
      select_device(user, own_device)
      sign_in(user)

      get fan_path, params: { device_code: other_device.code }

      expect(response).to have_http_status(:not_found)
    end

    it "requires authentication" do
      get fan_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get fan_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns the selected device fan" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      fan = create(:fan, :on, :auto, device: selected_device)
      create(:fan, device: other_device)
      select_device(user, selected_device)

      sign_in(user)
      get fan_path

      expect(response).to have_http_status(:ok)
      expect(json_response["fan"]["id"]).to eq(fan.id)
      expect(json_response["fan"]["device_id"]).to eq(selected_device.id)
      expect(json_response["fan"]["status"]).to eq("on")
      expect(json_response["fan"]["mode"]).to eq("auto")
    end

    it "returns fan as nil when no fan exists" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      get fan_path

      expect(response).to have_http_status(:ok)
      expect(json_response["fan"]).to be_nil
    end

    it "returns FAN_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:fan, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get fan_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("FAN_FETCHED")
    end
  end

  describe "PATCH /fan" do
    it "returns accepted with a durable pending command and the last confirmed fan state" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      fan = create(:fan, device: selected_device)
      select_device(user, selected_device)
      sign_in(user)

      patch fan_path, params: { fan: { status: "on" } }

      expect(response).to have_http_status(:accepted)
      expect(json_response.dig("fan", "command", "status")).to eq("pending")
      expect(json_response.dig("fan", "status")).to eq("off")
      expect(fan.reload.status).to eq("off")
      expect(selected_device.device_commands.pending.count).to eq(1)
    end

    it "requires authentication" do
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns FAN_NOT_FOUND when no fan exists" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      select_device(user, selected_device)

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "FAN_NOT_FOUND")
    end

    it "returns DEVICE_OFFLINE when the selected device is not connected" do
      user = create(:user)
      selected_device = create(:device, :offline, user: user)
      create(:fan, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:service_unavailable)
      expect(json_response).to eq("code" => "DEVICE_OFFLINE")
    end

    it "calls the fan request update service when the selected device is connected" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      selected_fan = create(:fan, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Fans::RequestUpdate).to receive(:call).and_return([])

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on",
          mode: "manual"
        }
      }

      expected_params = satisfy do |params|
        params.to_h == {
          "status" => "on",
          "mode" => "manual"
        }
      end

      expect(Devices::Fans::RequestUpdate).to have_received(:call).with(
        device: selected_device,
        fan: selected_fan,
        params: expected_params
      )
    end

    it "returns FAN_UPDATED when the service returns no errors" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      fan = create(:fan, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Fans::RequestUpdate).to receive(:call).and_return([])

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("FAN_UPDATED")
      expect(json_response["fan"]["id"]).to eq(fan.id)
    end

    it "returns FAN_UPDATE_FAILED when the service returns errors" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      create(:fan, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Fans::RequestUpdate).to receive(:call).and_return([
        "Device did not confirm the requested fan state"
      ])

      sign_in(user)
      patch fan_path, params: {
        fan: {
          status: "on"
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response).to eq(
        "code" => "FAN_UPDATE_FAILED",
        "errors" => ["Device did not confirm the requested fan state"]
      )
    end
  end
end
