class SyncWateringSchedulesJob < ApplicationJob
  queue_as :default

  def perform
    Devices::Watering::SyncSchedules.call(at: Time.current)
  end
end
