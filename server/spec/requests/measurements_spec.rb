require "rails_helper"

RSpec.describe "Measurements", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  def select_device(user, device)
    user.update!(selected_device_code: device.code)
  end

  def measurement_dates
    json_response["measurements"].map { |measurement| Date.parse(measurement["created_at"]) }
  end

  describe "GET /measurements" do
    it "requires authentication" do
      get measurements_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get measurements_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns selected device measurements" do
      user = create(:user)
      selected_device = create(:device, user: user)
      selected_measurement = create(
        :measurement,
        device: selected_device,
        created_at: Time.zone.local(2026, 4, 15, 10)
      )
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["measurements"].size).to eq(1)
      expect(json_response["measurements"].first["id"]).to eq(selected_measurement.id)
    end

    it "does not return another device's measurements" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      selected_measurement = create(
        :measurement,
        device: selected_device,
        created_at: Time.zone.local(2026, 4, 15, 10)
      )
      other_measurement = create(
        :measurement,
        device: other_device,
        created_at: Time.zone.local(2026, 4, 15, 11)
      )
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        date: "2026-04-15"
      }

      measurement_ids = json_response["measurements"].map { |measurement| measurement["id"] }

      expect(response).to have_http_status(:ok)
      expect(measurement_ids).to include(selected_measurement.id)
      expect(measurement_ids).not_to include(other_measurement.id)
    end

    it "returns MEASUREMENTS_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 15, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("MEASUREMENTS_FETCHED")
    end

    it "uses day period by default" do
      user = create(:user)
      selected_device = create(:device, user: user)
      inside_measurement = create(
        :measurement,
        device: selected_device,
        created_at: Time.zone.local(2026, 4, 15, 10)
      )
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 16, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["period"]).to eq("day")
      expect(json_response["measurements"].map { |measurement| measurement["id"] }).to eq([inside_measurement.id])
    end

    it "supports week period" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 13, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 15, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 20, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        period: "week",
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["period"]).to eq("week")
      expect(measurement_dates).to eq([Date.new(2026, 4, 13), Date.new(2026, 4, 15)])
    end

    it "supports month period" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 1, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 15, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 5, 1, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        period: "month",
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["period"]).to eq("month")
      expect(measurement_dates).to eq([Date.new(2026, 4, 1), Date.new(2026, 4, 15)])
    end

    it "supports year period" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 1, 15, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 6, 15, 10))
      create(:measurement, device: selected_device, created_at: Time.zone.local(2027, 1, 15, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        period: "year",
        date: "2026-04-15"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["period"]).to eq("year")
      expect(measurement_dates).to eq([Date.new(2026, 1, 1), Date.new(2026, 6, 1)])
    end

    it "falls back to the current date when date param is invalid" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 5, 1, 10))
      select_device(user, selected_device)

      sign_in(user)
      get measurements_path, params: {
        date: "not-a-date"
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["date"]).to eq(Date.current.iso8601)
    end
  end

  describe "GET /measurements/latest" do
    it "requires authentication" do
      get latest_measurements_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get latest_measurements_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns the latest five measurements" do
      user = create(:user)
      selected_device = create(:device, user: user)
      base_time = Time.zone.local(2026, 4, 15, 10)
      measurements = 6.times.map do |index|
        create(:measurement, device: selected_device, created_at: base_time + index.hours)
      end
      select_device(user, selected_device)

      sign_in(user)
      get latest_measurements_path

      measurement_ids = json_response["measurements"].map { |measurement| measurement["id"] }

      expect(response).to have_http_status(:ok)
      expect(measurement_ids).to eq(measurements.last(5).reverse.map(&:id))
    end

    it "orders measurements newest first" do
      user = create(:user)
      selected_device = create(:device, user: user)
      older_measurement = create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 15, 10))
      newer_measurement = create(:measurement, device: selected_device, created_at: Time.zone.local(2026, 4, 15, 11))
      select_device(user, selected_device)

      sign_in(user)
      get latest_measurements_path

      measurement_ids = json_response["measurements"].map { |measurement| measurement["id"] }

      expect(response).to have_http_status(:ok)
      expect(measurement_ids).to eq([newer_measurement.id, older_measurement.id])
    end

    it "returns MEASUREMENTS_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:measurement, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get latest_measurements_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("MEASUREMENTS_FETCHED")
    end
  end
end
