class ProcessDeviceCommandsJob < ApplicationJob
  queue_as :default

  def perform
    DeviceCommand.pending.find_each do |command|
      DeliverDeviceCommandJob.perform_now(command.id)
    end
  end
end
