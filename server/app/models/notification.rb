class Notification < ApplicationRecord
  belongs_to :user, inverse_of: :notifications
  belongs_to :device, inverse_of: :notifications

  validates :kind, :title, :message, presence: true

  def client_payload
    as_json.merge(
      "device_name" => device&.name,
      "device_code" => device&.code,
      "is_read" => read_at.present?,
      "created_at" => created_at&.iso8601,
      "read_at" => read_at&.iso8601
    )
  end
end
