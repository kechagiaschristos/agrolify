require "rails_helper"

RSpec.describe "Notifications", type: :request do
  def json_response
    JSON.parse(response.body)
  end

  def sign_in(user)
    cookies[:auth_token] = JsonWebToken.encode(user_id: user.id)
  end

  describe "GET /notifications" do
    it "requires authentication" do
      get notifications_path

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "returns current user notifications only" do
      user = create(:user)
      other_user = create(:user)
      notification = create(:notification, user: user)
      other_notification = create(:notification, user: other_user)

      sign_in(user)
      get notifications_path

      notification_ids = json_response["notifications"].map { |notification| notification["id"] }

      expect(response).to have_http_status(:ok)
      expect(notification_ids).to include(notification.id)
      expect(notification_ids).not_to include(other_notification.id)
    end

    it "orders notifications newest first" do
      user = create(:user)
      older_notification = create(:notification, user: user, created_at: 2.hours.ago)
      newer_notification = create(:notification, user: user, created_at: 1.hour.ago)

      sign_in(user)
      get notifications_path

      notification_ids = json_response["notifications"].map { |notification| notification["id"] }

      expect(response).to have_http_status(:ok)
      expect(notification_ids).to eq([newer_notification.id, older_notification.id])
    end

    it "paginates notifications" do
      user = create(:user)
      notifications = 11.times.map do |index|
        create(:notification, user: user, created_at: Time.zone.local(2026, 4, 15, 10) + index.minutes)
      end

      sign_in(user)
      get notifications_path, params: {
        page: 2
      }

      notification_ids = json_response["notifications"].map { |notification| notification["id"] }

      expect(response).to have_http_status(:ok)
      expect(json_response["page"]).to eq(2)
      expect(json_response["limit"]).to eq(10)
      expect(notification_ids).to eq([notifications.first.id])
    end

    it "returns total and unread_total" do
      user = create(:user)
      create(:notification, :unread, user: user)
      create(:notification, :unread, user: user)
      create(:notification, :read, user: user)

      sign_in(user)
      get notifications_path

      expect(response).to have_http_status(:ok)
      expect(json_response["total"]).to eq(3)
      expect(json_response["unread_total"]).to eq(2)
    end

    it "returns NOTIFICATIONS_FETCHED" do
      user = create(:user)
      create(:notification, user: user)

      sign_in(user)
      get notifications_path

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("NOTIFICATIONS_FETCHED")
    end
  end

  describe "PATCH /notifications/:id" do
    it "requires authentication" do
      notification = create(:notification)

      patch notification_path(notification)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "marks the notification as read" do
      user = create(:user)
      notification = create(:notification, :unread, user: user)

      sign_in(user)
      patch notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(notification.reload.read_at).to be_present
      expect(json_response["notification"]["is_read"]).to be(true)
    end

    it "returns NOTIFICATION_UPDATED" do
      user = create(:user)
      notification = create(:notification, user: user)

      sign_in(user)
      patch notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("NOTIFICATION_UPDATED")
    end

    it "updates unread_total" do
      user = create(:user)
      notification = create(:notification, :unread, user: user)
      create(:notification, :unread, user: user)

      sign_in(user)
      patch notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(json_response["total"]).to eq(2)
      expect(json_response["unread_total"]).to eq(1)
    end

    it "returns NOTIFICATION_NOT_FOUND for an unknown notification" do
      user = create(:user)

      sign_in(user)
      patch notification_path(0)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "NOTIFICATION_NOT_FOUND")
    end

    it "returns NOTIFICATION_NOT_FOUND for another user's notification" do
      user = create(:user)
      other_user = create(:user)
      notification = create(:notification, user: other_user)

      sign_in(user)
      patch notification_path(notification)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "NOTIFICATION_NOT_FOUND")
    end
  end

  describe "DELETE /notifications/:id" do
    it "requires authentication" do
      notification = create(:notification)

      delete notification_path(notification)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response).to eq("code" => "AUTH_UNAUTHORIZED")
    end

    it "deletes the notification" do
      user = create(:user)
      notification = create(:notification, user: user)

      sign_in(user)
      delete notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(Notification.exists?(notification.id)).to be(false)
    end

    it "returns NOTIFICATION_DELETED" do
      user = create(:user)
      notification = create(:notification, user: user)

      sign_in(user)
      delete notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(json_response["code"]).to eq("NOTIFICATION_DELETED")
      expect(json_response["notification_id"]).to eq(notification.id)
    end

    it "updates totals" do
      user = create(:user)
      notification = create(:notification, :unread, user: user)
      create(:notification, :unread, user: user)
      create(:notification, :read, user: user)

      sign_in(user)
      delete notification_path(notification)

      expect(response).to have_http_status(:ok)
      expect(json_response["total"]).to eq(2)
      expect(json_response["unread_total"]).to eq(1)
    end

    it "returns NOTIFICATION_NOT_FOUND for an unknown notification" do
      user = create(:user)

      sign_in(user)
      delete notification_path(0)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "NOTIFICATION_NOT_FOUND")
    end

    it "returns NOTIFICATION_NOT_FOUND for another user's notification" do
      user = create(:user)
      other_user = create(:user)
      notification = create(:notification, user: other_user)

      sign_in(user)
      delete notification_path(notification)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to eq("code" => "NOTIFICATION_NOT_FOUND")
    end
  end
end
