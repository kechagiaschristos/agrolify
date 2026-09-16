module Devices
  module Watering
    class SyncSchedules
      ACTIVE_LOG_STATUSES = %w[starting running stopping].freeze
      LEASE_SECONDS = 45
      RENEW_INTERVAL = 15.seconds

      def self.call(at: Time.current, device: nil)
        ids = device ? [ device.id ] : (
          WateringSchedule.where(active: true).distinct.pluck(:device_id) +
          WateringLog.where(status: ACTIVE_LOG_STATUSES).distinct.pluck(:device_id)
        ).uniq
        Device.where(id: ids).find_each do |record|
          record.with_lock { new(record, at).sync }
        end
      end

      def initialize(device, at)
        @device = device
        @at = at
      end

      def sync
        log = @device.watering_logs.where(status: ACTIVE_LOG_STATUSES).order(started_at: :desc).first
        ending_at = active_schedule_end

        # An unconfirmed stop must finish before another irrigation cycle starts.
        if log&.stopping? || !ending_at
          stop(log) if log
          return
        end
        return unless @device.connected?

        log ||= @device.watering_logs.create!(started_at: @at, status: "starting")
        command = log.device_commands.where(kind: "water_pump.update").order(created_at: :desc).first
        return if command&.pending?
        return if command&.confirmed? && command.created_at > @at - RENEW_INTERVAL

        remaining = (ending_at - @at).ceil
        DeviceCommand.submit!(
          device: @device, kind: "water_pump.update", watering_log: log, expires_at: ending_at,
          parameters: { status: "on", lease_seconds: [ LEASE_SECONDS, remaining ].min }
        )
      end

      private

      def stop(log)
        log.update!(status: "stopping") unless log.stopping?
        DeviceCommand.submit!(
          device: @device, kind: "water_pump.update", watering_log: log,
          expires_at: nil, parameters: { status: "off" }
        )
      end

      def active_schedule_end
        local = @at.in_time_zone(@device.schedule_time_zone)
        seconds = local.seconds_since_midnight
        @device.watering_schedules.where(active: true, day_of_week: local.wday).filter_map do |schedule|
          start_seconds = schedule.start_time.seconds_since_midnight
          end_seconds = schedule.end_time.seconds_since_midnight
          next unless start_seconds <= seconds && seconds < end_seconds

          local.change(hour: schedule.end_time.hour, min: schedule.end_time.min, sec: schedule.end_time.sec)
        end.max
      end
    end
  end
end
