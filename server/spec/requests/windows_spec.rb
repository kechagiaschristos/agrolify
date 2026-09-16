require "rails_helper"

RSpec.describe "Window", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  def select_device(user, device)
    user.update!(selected_device_code: device.code)
  end

  describe "GET /window" do
    it "requires authentication" do
      get window_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get window_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns the selected device window" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      window = create(:window, :left_open, device: selected_device)
      create(:window, :open, device: other_device)
      select_device(user, selected_device)

      sign_in(user)
      get window_path

      expect(response).to have_http_status(:ok)
      expect(json_response["window"]["id"]).to eq(window.id)
      expect(json_response["window"]["device_id"]).to eq(selected_device.id)
      expect(json_response["window"]["left_window_status"]).to eq("open")
      expect(json_response["window"]["right_window_status"]).to eq("closed")
    end

    it "returns window as nil when no window exists" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      get window_path

      expect(response).to have_http_status(:ok)
      expect(json_response["window"]).to be_nil
    end

    it "returns WINDOW_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:window, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get window_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WINDOW_FETCHED")
    end
  end

  describe "PATCH /window" do
    it "returns accepted immediately for a both-window command" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      create(:window, device: selected_device)
      select_device(user, selected_device)
      sign_in(user)

      patch window_path, params: { window: { left_window_status: "open", right_window_status: "open" } }

      expect(response).to have_http_status(:accepted)
      expect(json_response.dig("window", "command", "status")).to eq("pending")
      expect(json_response.dig("window", "left_window_status")).to eq("closed")
    end

    it "requires authentication" do
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns WINDOW_NOT_FOUND when no window exists" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      select_device(user, selected_device)

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "WINDOW_NOT_FOUND")
    end

    it "returns DEVICE_OFFLINE when the selected device is not connected" do
      user = create(:user)
      selected_device = create(:device, :offline, user: user)
      create(:window, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:service_unavailable)
      expect(json_response).to eq("code" => "DEVICE_OFFLINE")
    end

    it "calls the window request update service when the selected device is connected" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      selected_window = create(:window, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Windows::RequestUpdate).to receive(:call).and_return([])

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open",
          right_window_status: "closed"
        }
      }

      expected_params = satisfy do |params|
        params.to_h == {
          "left_window_status" => "open",
          "right_window_status" => "closed"
        }
      end

      expect(Devices::Windows::RequestUpdate).to have_received(:call).with(
        device: selected_device,
        window: selected_window,
        params: expected_params
      )
    end

    it "returns WINDOW_UPDATED when the service returns no errors" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      window = create(:window, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Windows::RequestUpdate).to receive(:call).and_return([])

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WINDOW_UPDATED")
      expect(json_response["window"]["id"]).to eq(window.id)
    end

    it "returns WINDOW_UPDATE_FAILED when the service returns errors" do
      user = create(:user)
      selected_device = create(:device, :connected, user: user)
      create(:window, device: selected_device)
      select_device(user, selected_device)

      allow(Devices::Windows::RequestUpdate).to receive(:call).and_return([
        "Device did not confirm the requested window state"
      ])

      sign_in(user)
      patch window_path, params: {
        window: {
          left_window_status: "open"
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response).to eq(
        "code" => "WINDOW_UPDATE_FAILED",
        "errors" => ["Device did not confirm the requested window state"]
      )
    end
  end
end
