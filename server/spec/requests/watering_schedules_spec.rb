require "rails_helper"

RSpec.describe "Watering schedules", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  def select_device(user, device)
    user.update!(selected_device_code: device.code)
  end

  def valid_watering_schedule_params
    {
      watering_schedule: {
        day_of_week: 2,
        start_time: "09:00",
        end_time: "09:30",
        active: true
      }
    }
  end

  def invalid_watering_schedule_params
    {
      watering_schedule: {
        day_of_week: 8,
        start_time: "09:30",
        end_time: "09:00",
        active: true
      }
    }
  end

  describe "GET /watering_schedules" do
    it "requires authentication" do
      get watering_schedules_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      get watering_schedules_path

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "returns selected device watering schedules" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      selected_schedule = create(:watering_schedule, :active, :morning, device: selected_device)
      create(:watering_schedule, :evening, device: other_device)
      select_device(user, selected_device)

      sign_in(user)
      get watering_schedules_path

      watering_schedule_ids = json_response["watering_schedules"].map { |schedule| schedule["id"] }
      watering_schedule = json_response["watering_schedules"].first

      expect(response).to have_http_status(:ok)
      expect(watering_schedule_ids).to eq([selected_schedule.id])
      expect(watering_schedule["device_id"]).to eq(selected_device.id)
      expect(watering_schedule["day_of_week"]).to eq(1)
      expect(watering_schedule["start_time"]).to eq("08:00:00")
      expect(watering_schedule["end_time"]).to eq("08:30:00")
      expect(watering_schedule["active"]).to be(true)
    end

    it "returns WATERING_SCHEDULES_FETCHED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      create(:watering_schedule, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      get watering_schedules_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WATERING_SCHEDULES_FETCHED")
    end
  end

  describe "POST /watering_schedules" do
    it "requires authentication" do
      post watering_schedules_path, params: valid_watering_schedule_params

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)

      sign_in(user)
      post watering_schedules_path, params: valid_watering_schedule_params

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "creates a valid watering schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)

      post watering_schedules_path, params: valid_watering_schedule_params

      watering_schedule = selected_device.watering_schedules.last

      expect(response).to have_http_status(:ok)
      expect(watering_schedule.day_of_week).to eq(2)
      expect(watering_schedule.start_time.strftime("%H:%M:%S")).to eq("09:00:00")
      expect(watering_schedule.end_time.strftime("%H:%M:%S")).to eq("09:30:00")
      expect(watering_schedule.active).to be(true)
    end

    it "returns WATERING_SCHEDULES_CREATED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      post watering_schedules_path, params: valid_watering_schedule_params

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WATERING_SCHEDULES_CREATED")
    end

    it "rejects invalid watering schedule params" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)

     post watering_schedules_path, params: invalid_watering_schedule_params

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]).to be_present
    end

    it "returns WATERING_SCHEDULES_CREATE_FAILED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      post watering_schedules_path, params: invalid_watering_schedule_params

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("WATERING_SCHEDULES_CREATE_FAILED")
    end
  end

  describe "PATCH /watering_schedules/:id" do
    it "requires authentication" do
      watering_schedule = create(:watering_schedule)

      patch watering_schedule_path(watering_schedule), params: valid_watering_schedule_params

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)
      watering_schedule = create(:watering_schedule)

      sign_in(user)
      patch watering_schedule_path(watering_schedule), params: valid_watering_schedule_params

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "updates a selected device watering schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, :inactive, :morning, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(watering_schedule), params: valid_watering_schedule_params

      watering_schedule.reload

      expect(response).to have_http_status(:ok)
      expect(watering_schedule.day_of_week).to eq(2)
      expect(watering_schedule.start_time.strftime("%H:%M:%S")).to eq("09:00:00")
      expect(watering_schedule.end_time.strftime("%H:%M:%S")).to eq("09:30:00")
      expect(watering_schedule.active).to be(true)
      expect(json_response["watering_schedule"]["id"]).to eq(watering_schedule.id)
    end

    it "returns WATERING_SCHEDULE_UPDATED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(watering_schedule), params: valid_watering_schedule_params

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WATERING_SCHEDULE_UPDATED")
    end

    it "rejects invalid watering schedule params" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, :morning, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(watering_schedule), params: invalid_watering_schedule_params

      watering_schedule.reload

      expect(response).to have_http_status(:unprocessable_entity)
      expect(watering_schedule.day_of_week).to eq(1)
      expect(watering_schedule.start_time.strftime("%H:%M:%S")).to eq("08:00:00")
      expect(watering_schedule.end_time.strftime("%H:%M:%S")).to eq("08:30:00")
      expect(json_response["errors"]).to be_present
    end

    it "returns WATERING_SCHEDULE_UPDATE_FAILED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(watering_schedule), params: invalid_watering_schedule_params

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["code"]).to eq("WATERING_SCHEDULE_UPDATE_FAILED")
    end

    it "returns WATERING_SCHEDULE_NOT_FOUND for an unknown schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(id: 0), params: valid_watering_schedule_params

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "WATERING_SCHEDULE_NOT_FOUND")
    end

    it "returns WATERING_SCHEDULE_NOT_FOUND for another device's schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      other_schedule = create(:watering_schedule, device: other_device)
      select_device(user, selected_device)

      sign_in(user)
      patch watering_schedule_path(other_schedule), params: valid_watering_schedule_params

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "WATERING_SCHEDULE_NOT_FOUND")
    end
  end

  describe "DELETE /watering_schedules/:id" do
    it "requires authentication" do
      watering_schedule = create(:watering_schedule)

      delete watering_schedule_path(watering_schedule)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "requires a selected device" do
      user = create(:user)
      watering_schedule = create(:watering_schedule)

      sign_in(user)
      delete watering_schedule_path(watering_schedule)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "DEVICE_NOT_FOUND")
    end

    it "deletes a selected device watering schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)

      delete watering_schedule_path(watering_schedule)

      expect(response).to have_http_status(:ok)
      expect(WateringSchedule.exists?(watering_schedule.id)).to be(false)
    end

    it "returns WATERING_SCHEDULE_DELETED" do
      user = create(:user)
      selected_device = create(:device, user: user)
      watering_schedule = create(:watering_schedule, device: selected_device)
      select_device(user, selected_device)

      sign_in(user)
      delete watering_schedule_path(watering_schedule)

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("WATERING_SCHEDULE_DELETED")
      expect(json_response["schedule_id"]).to eq(watering_schedule.id)
    end

    it "returns WATERING_SCHEDULE_NOT_FOUND for an unknown schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      select_device(user, selected_device)

      sign_in(user)
      delete watering_schedule_path(id: 0)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "WATERING_SCHEDULE_NOT_FOUND")
    end

    it "returns WATERING_SCHEDULE_NOT_FOUND for another device's schedule" do
      user = create(:user)
      selected_device = create(:device, user: user)
      other_device = create(:device, user: user)
      other_schedule = create(:watering_schedule, device: other_device)
      select_device(user, selected_device)

      sign_in(user)
      delete watering_schedule_path(other_schedule)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "WATERING_SCHEDULE_NOT_FOUND")
    end
  end
end
