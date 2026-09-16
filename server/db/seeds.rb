# Realistic, idempotent demo data for local development.
# Run with: bin/rails db:seed

puts "Seeding Agrolify demo data..."

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo1234"
LEGACY_DEMO_EMAILS = ["grower@example.com", "demo@agrolify.test"].freeze
LEGACY_DEMO_DEVICE_CODES = ["roof-herbs"].freeze
HISTORICAL_MEASUREMENT_YEARS = [2025].freeze

DEVICE_BLUEPRINTS = [
  {
    code: "greenh-main",
    name: "Main Greenhouse",
    description: "Primary production greenhouse focused on tomatoes, peppers, and daily climate balancing.",
    token_env: "MAIN_DEVICE_TOKEN",
    default_token: "a1f4c9e2b7d84a66c310f8a5d29e7b11",
    time_zone: "Europe/Athens",
    last_seen_minutes_ago: 6,
    temperature_air_min_c: 18,
    temperature_air_max_c: 28,
    ventilation_temperature_min_c: 20,
    ventilation_temperature_max_c: 26,
    water_tank_capacity_liters: 80,
    temperature_unit: "cel",
    liquid_unit: "liters",
    coordinates: {latitude: 35.3387, longitude: 25.1442},
    profile: {
      air_base: 22.8,
      air_daily: 4.6,
      air_seasonal: 2.1,
      air_weekly: 0.8,
      humidity_base: 63.0,
      humidity_daily: 8.2,
      humidity_secondary: 4.1,
      humidity_seasonal: 2.4,
      soil_temperature_base: 20.2,
      soil_temperature_daily: 1.9,
      soil_temperature_seasonal: 1.2,
      soil_temperature_weekly: 0.5,
      soil_moisture_base: 57.0,
      soil_moisture_daily: 4.8,
      soil_moisture_weekly: 1.9,
      soil_moisture_irrigation_boost: 6.5,
      water_refill_every_days: 17,
      water_refill_offset_days: 3,
      water_draw_per_day: 2.2,
      water_hourly_loss: 1.1,
    },
    fan: {status: "on", mode: "auto"},
    window: {left_window_status: "open", right_window_status: "open"},
    schedules: [
      {day_of_week: 1, start_time: "06:00", end_time: "06:10", active: true},
      {day_of_week: 3, start_time: "18:15", end_time: "18:24", active: true},
      {day_of_week: 5, start_time: "07:00", end_time: "07:08", active: true},
    ],
  },
  {
    code: "greenh-backup",
    name: "Propagation Tent",
    description: "High-humidity propagation tent used for seedlings, cuttings, and young leafy greens.",
    token_env: "BACKUP_DEVICE_TOKEN",
    default_token: "b7e21d94c8f34a0ea5d11c67f28ab392",
    time_zone: "Europe/Athens",
    last_seen_minutes_ago: 18,
    temperature_air_min_c: 19,
    temperature_air_max_c: 25,
    ventilation_temperature_min_c: 21,
    ventilation_temperature_max_c: 24,
    water_tank_capacity_liters: 40,
    temperature_unit: "cel",
    liquid_unit: "liters",
    coordinates: {latitude: 35.3219, longitude: 25.1132},
    profile: {
      air_base: 24.0,
      air_daily: 3.0,
      air_seasonal: 1.4,
      air_weekly: 0.5,
      humidity_base: 72.0,
      humidity_daily: 6.1,
      humidity_secondary: 3.6,
      humidity_seasonal: 1.6,
      soil_temperature_base: 21.0,
      soil_temperature_daily: 1.4,
      soil_temperature_seasonal: 0.8,
      soil_temperature_weekly: 0.4,
      soil_moisture_base: 63.0,
      soil_moisture_daily: 3.6,
      soil_moisture_weekly: 1.2,
      soil_moisture_irrigation_boost: 5.0,
      water_refill_every_days: 12,
      water_refill_offset_days: 5,
      water_draw_per_day: 1.3,
      water_hourly_loss: 0.7,
    },
    fan: {status: "on", mode: "auto"},
    window: {left_window_status: "closed", right_window_status: "closed"},
    schedules: [
      {day_of_week: 0, start_time: "07:30", end_time: "07:36", active: true},
      {day_of_week: 2, start_time: "07:15", end_time: "07:22", active: true},
      {day_of_week: 4, start_time: "19:00", end_time: "19:06", active: true},
    ],
  },
].freeze

NOTIFICATION_BLUEPRINTS = [
  {
    device_code: "greenh-main",
    title: "Reservoir refill planned",
    kind: "water_tank_alert",
    message: "Main Greenhouse water reserves are trending down and should be topped up before the next heavy irrigation window.",
    hours_ago: 3,
    read: false,
  },
  {
    device_code: "greenh-main",
    title: "Overnight humidity spike",
    kind: "humidity_warning",
    message: "Humidity climbed above the comfort band overnight. Ventilation automation responded and conditions are easing.",
    hours_ago: 14,
    read: true,
  },
  {
    device_code: "greenh-backup",
    title: "Propagation cycle completed",
    kind: "watering_update",
    message: "The evening seedling watering cycle finished cleanly with stable moisture retention afterward.",
    hours_ago: 28,
    read: true,
  },
].freeze

def clamp(value, min, max)
  [[value, min].max, max].min
end

def time_zone_for(name)
  ActiveSupport::TimeZone[name] || Time.zone
end

def build_timestamp(date, hour, minute = 0, time_zone_name = Time.zone.name)
  zone = time_zone_for(time_zone_name)
  zone.local(date.year, date.month, date.day, hour, minute, 0)
end

def measurement_timestamps_for(time_zone_name)
  zone = time_zone_for(time_zone_name)
  today = Time.current.in_time_zone(zone).to_date
  week_start = today.beginning_of_week(:monday)
  week_end = today.end_of_week(:monday)
  month_start = today.beginning_of_month
  month_end = today.end_of_month
  timestamps = []

  (HISTORICAL_MEASUREMENT_YEARS + [today.year]).uniq.each do |year|
    date_cursor = Date.new(year, 1, 1)

    while date_cursor <= Date.new(year, 12, 31)
      timestamps << build_timestamp(date_cursor, 8, 0, time_zone_name)
      timestamps << build_timestamp(date_cursor, 18, 0, time_zone_name)
      date_cursor += 1
    end
  end

  date_cursor = week_start
  while date_cursor <= week_end
    [[6, 0], [10, 0], [14, 0], [18, 0], [22, 0]].each do |hour, minute|
      timestamps << build_timestamp(date_cursor, hour, minute, time_zone_name)
    end
    date_cursor += 1
  end

  date_cursor = month_start
  while date_cursor <= month_end
    if date_cursor == today
      48.times do |half_hour_index|
        hour = half_hour_index / 2
        minute = half_hour_index.odd? ? 30 : 0
        timestamps << build_timestamp(date_cursor, hour, minute, time_zone_name)
      end
    elsif date_cursor > week_end
      timestamps << build_timestamp(date_cursor, 8, 0, time_zone_name)
      timestamps << build_timestamp(date_cursor, 18, 0, time_zone_name)
    end

    date_cursor += 1
  end

  timestamps.uniq.sort
end

def build_measurement_values(timestamp, blueprint)
  profile = blueprint.fetch(:profile)
  hour_fraction = timestamp.hour + (timestamp.min / 60.0)
  day_index = (timestamp.to_date - timestamp.to_date.beginning_of_year).to_i
  daily_cycle = Math.sin(((hour_fraction - 6.0) / 24.0) * (2 * Math::PI))
  humidity_cycle = Math.cos(((hour_fraction - 4.0) / 24.0) * (2 * Math::PI))
  yearly_cycle = Math.sin(((timestamp.yday - 1) / 365.0) * (2 * Math::PI))
  weekly_cycle = Math.sin((day_index / 7.0) * (2 * Math::PI))
  irrigation_days = blueprint.fetch(:schedules).select { |schedule| schedule[:active] }.map { |schedule| schedule[:day_of_week] }
  irrigation_boost = irrigation_days.include?(timestamp.wday) && hour_fraction.between?(5.5, 8.5) ? profile[:soil_moisture_irrigation_boost] : 0.0
  midday_drydown = hour_fraction.between?(11.0, 17.5) ? ((hour_fraction - 11.0) / 6.5) * 2.2 : 0.0

  air_temperature = profile[:air_base] + (daily_cycle * profile[:air_daily]) + (yearly_cycle * profile[:air_seasonal]) + (weekly_cycle * profile[:air_weekly])
  air_humidity = profile[:humidity_base] - (daily_cycle * profile[:humidity_daily]) + (humidity_cycle * profile[:humidity_secondary]) - (yearly_cycle * profile[:humidity_seasonal])
  soil_temperature = profile[:soil_temperature_base] + (daily_cycle * profile[:soil_temperature_daily]) + (yearly_cycle * profile[:soil_temperature_seasonal]) + (weekly_cycle * profile[:soil_temperature_weekly])
  soil_moisture = profile[:soil_moisture_base] - (daily_cycle * profile[:soil_moisture_daily]) - (weekly_cycle * profile[:soil_moisture_weekly]) + irrigation_boost - midday_drydown

  refill_cycle_position = (day_index + profile[:water_refill_offset_days]) % profile[:water_refill_every_days]
  water_level = blueprint[:water_tank_capacity_liters] - 5 - (refill_cycle_position * profile[:water_draw_per_day]) - ((hour_fraction / 24.0) * profile[:water_hourly_loss])
  water_level += 6 if refill_cycle_position.zero? && hour_fraction <= 8.0
  water_level += 3 if irrigation_boost.positive?

  {
    air_temperature_c: clamp(air_temperature.round(1), blueprint[:temperature_air_min_c] - 3.0, blueprint[:temperature_air_max_c] + 4.0),
    air_humidity: clamp(air_humidity.round(1), 42.0, 90.0),
    soil_temperature_c: clamp(soil_temperature.round(1), 15.0, 29.0),
    soil_moisture: clamp(soil_moisture.round(1), 32.0, 84.0),
    water_level_liters: clamp(water_level.round, 10, blueprint[:water_tank_capacity_liters] - 1),
  }
end

def seed_measurements_for_device(device, blueprint)
  measurement_timestamps_for(device.time_zone).each do |timestamp|
    values = build_measurement_values(timestamp, blueprint)

    Measurement.find_or_initialize_by(device: device, created_at: timestamp).tap do |measurement|
      measurement.assign_attributes(
        air_temperature_c: values[:air_temperature_c],
        air_humidity: values[:air_humidity],
        soil_temperature_c: values[:soil_temperature_c],
        soil_moisture: values[:soil_moisture],
        gps_latitude: blueprint.dig(:coordinates, :latitude),
        gps_longitude: blueprint.dig(:coordinates, :longitude),
        water_level_liters: values[:water_level_liters]
      )
      measurement.save!
    end
  end

  sparse_timestamp = build_timestamp(Time.current.in_time_zone(device.time_zone).to_date - 2.days, 3, 0, device.time_zone)
  Measurement.find_or_initialize_by(device: device, created_at: sparse_timestamp).tap do |measurement|
    measurement.assign_attributes(
      air_temperature_c: nil,
      air_humidity: nil,
      soil_temperature_c: nil,
      soil_moisture: 100,
      gps_latitude: nil,
      gps_longitude: nil,
      water_level_liters: [device.water_tank_capacity_liters, 100].min
    )
    measurement.save!
  end
end

def seed_schedules_for_device(device, blueprint)
  blueprint.fetch(:schedules).each do |schedule_blueprint|
    WateringSchedule.find_or_initialize_by(device: device, day_of_week: schedule_blueprint[:day_of_week]).tap do |schedule|
      schedule.assign_attributes(
        start_time: schedule_blueprint[:start_time],
        end_time: schedule_blueprint[:end_time],
        active: schedule_blueprint[:active]
      )
      schedule.save!
    end
  end
end

def seed_logs_for_device(device, active_logs: false)
  zone_today = Time.current.in_time_zone(device.time_zone).to_date

  24.times do |index|
    started_at = build_timestamp(zone_today - (index / 2), index.even? ? 6 : 18, (index * 7) % 20, device.time_zone)
    status = if active_logs && index.zero?
      "starting"
    elsif active_logs && index == 1
      "running"
    else
      "finished"
    end

    WateringLog.find_or_initialize_by(device: device, started_at: started_at).tap do |log|
      attributes = {status: status}

      if status == "finished"
        duration_minutes = 5 + ((index + device.name.length) % 7)
        attributes[:finished_at] = started_at + duration_minutes.minutes
        attributes[:water_used_liters] = 4 + ((index + device.code.length) % 10)
      else
        attributes[:finished_at] = nil
        attributes[:water_used_liters] = nil
      end

      log.assign_attributes(attributes)
      log.save!
    end
  end
end

def seed_controls_for_device(device, blueprint)
  fan = device.fan || device.build_fan
  fan.assign_attributes(blueprint.fetch(:fan))
  fan.save!

  window = device.window || device.build_window
  window.assign_attributes(blueprint.fetch(:window))
  window.save!
end

def seed_notifications_for_user(user, devices_by_code)
  NOTIFICATION_BLUEPRINTS.each do |notification_blueprint|
    device = devices_by_code.fetch(notification_blueprint[:device_code])
    created_at = notification_blueprint[:hours_ago].hours.ago

    Notification.find_or_initialize_by(user: user, device: device, title: notification_blueprint[:title]).tap do |notification|
      notification.kind = notification_blueprint[:kind]
      notification.message = notification_blueprint[:message]
      notification.read_at = notification_blueprint[:read] ? created_at + 2.hours : nil
      notification.created_at = created_at if notification.new_record?
      notification.save!
    end
  end
end

user = User.find_by(email: DEMO_EMAIL)
user ||= User.find_by(email: LEGACY_DEMO_EMAILS)
user ||= User.new

user.assign_attributes(
  email: DEMO_EMAIL,
  first_name: "Demo",
  last_name: "Grower",
  password: DEMO_PASSWORD,
  password_confirmation: DEMO_PASSWORD,
  theme: "light",
  locale: "en",
  avatar: User::DEFAULT_AVATAR
)
user.save!

user.devices.where(code: LEGACY_DEMO_DEVICE_CODES).find_each(&:destroy!)

devices_by_code = DEVICE_BLUEPRINTS.each_with_object({}) do |blueprint, devices|
  device = Device.find_or_initialize_by(code: blueprint[:code])
  device.assign_attributes(
    user: user,
    name: blueprint[:name],
    description: blueprint[:description],
    token: ENV.fetch(blueprint[:token_env], blueprint[:default_token]),
    temperature_air_min_c: blueprint[:temperature_air_min_c],
    temperature_air_max_c: blueprint[:temperature_air_max_c],
    ventilation_temperature_min_c: blueprint[:ventilation_temperature_min_c],
    ventilation_temperature_max_c: blueprint[:ventilation_temperature_max_c],
    water_tank_capacity_liters: blueprint[:water_tank_capacity_liters],
    temperature_unit: blueprint[:temperature_unit],
    liquid_unit: blueprint[:liquid_unit],
    time_zone: blueprint[:time_zone],
    last_seen_at: blueprint[:last_seen_minutes_ago].minutes.ago
  )
  device.save!
  devices[device.code] = device
end

user.update!(selected_device_code: devices_by_code.fetch("greenh-main").code)

DEVICE_BLUEPRINTS.each do |blueprint|
  device = devices_by_code.fetch(blueprint[:code])
  seed_measurements_for_device(device, blueprint)
  seed_schedules_for_device(device, blueprint)
  seed_logs_for_device(device, active_logs: device.code == "greenh-main")
  seed_controls_for_device(device, blueprint)
end

seed_notifications_for_user(user, devices_by_code)

puts "Demo seed complete."
puts "User: #{DEMO_EMAIL} / #{DEMO_PASSWORD}"
puts "Devices: #{devices_by_code.size}"
puts "Selected device: #{devices_by_code.fetch("greenh-main").name}"
