class WateringSchedule < ApplicationRecord
  belongs_to :device, inverse_of: :watering_schedules

  validates :day_of_week,
            presence: true,
            inclusion: { in: 0..6 }
  validates :start_time, :end_time, presence: true
  validates :active, inclusion: { in: [true, false] }
  validates :end_time, comparison: { greater_than: :start_time }, if: -> { start_time.present? && end_time.present? }
end
