class WateringLog < ApplicationRecord
  enum :status, { running: "running", starting: "starting", stopping: "stopping", finished: "finished" }
  belongs_to :device, inverse_of: :watering_logs
  has_many :device_commands, dependent: :destroy

  validates :started_at, :status, presence: true
  validates :finished_at, presence: true, if: :finished?

  validates :water_used_liters,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 },
            allow_nil: true,
            if: :finished?
  validates :finished_at, absence: true, unless: :finished?
end
