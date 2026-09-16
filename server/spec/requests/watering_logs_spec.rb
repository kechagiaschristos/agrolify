require "rails_helper"

RSpec.describe "Watering logs", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  def select_device(user, device)
    user.update!(selected_device_code: device.code)
  end

  describe "GET /watering_logs" do
    it "requires authentication" do
      get watering_logs_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get watering_logs_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns selected device watering logs only" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      selected_log = create(:watering_log, device: selected_device, started_at: Time.zone.local(2026, 4, 15, 10))
      other_log = create(:watering_log, device: other_device, started_at: Time.zone.local(2026, 4, 15, 11))
      select_device(user, selected_device)

      sign_in(user)
      get watering_logs_path

      watering_log_ids = json_response["watering_logs"].map { |log| log["id"] }

      expect(response).to have_http_status(:ok)
      expect(watering_log_ids).to include(selected_log.id)
      expect(watering_log_ids).not_to include(other_log.id)
    end

    it "orders watering logs by started_at descending" do
      user = create(:user)
      selected_device = create(:device, user: user)
      older_log = create(:watering_log, device: selected_device, started_at: Time.zone.local(2026, 4, 15, 10))
      newer_log = create(:watering_log, device: selected_device, started_at: Time.zone.local(2026, 4, 15, 11))
      select_device(user, selected_device)

      sign_in(user)
      get watering_logs_path

      watering_log_ids = json_response["watering_logs"].map { |log| log["id"] }

      expect(response).to have_http_status(:ok)
      expect(watering_log_ids).to eq([newer_log.id, older_log.id])
    end

    it "paginates watering logs" do
      user = create(:user)
      selected_device = create(:device, user: user)
      base_time = Time.zone.local(2026, 4, 15, 10)
      watering_logs = 21.times.map do |index|
        create(:watering_log, device: selected_device, started_at: base_time + index.minutes)
      end
      select_device(user, selected_device)

      sign_in(user)
      get watering_logs_path, params: {
        page: 2
      }

      watering_log_ids = json_response["watering_logs"].map { |log| log["id"] }

      expect(response).to have_http_status(:ok)
      expect(json_response["page"]).to eq(2)
      expect(json_response["limit"]).to eq(20)
      expect(watering_log_ids).to eq([watering_logs.first.id])
    end

    it "returns total, page, and limit" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create_list(:watering_log, 3, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get watering_logs_path, params: {
        page: 1
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["total"]).to eq(3)
      expect(json_response["page"]).to eq(1)
      expect(json_response["limit"]).to eq(20)
    end

    it "returns WATERING_LOGS_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:watering_log, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get watering_logs_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WATERING_LOGS_FETCHED")
    end
  end
end
