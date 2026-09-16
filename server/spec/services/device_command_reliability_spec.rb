require "rails_helper"

RSpec.describe "Device command reliability" do
  include ActiveSupport::Testing::TimeHelpers

  let(:device) { create(:device, :connected, time_zone: "UTC") }

  def acknowledge(command, payload: command.parameters, status: "ok", message_id: command.id)
    Devices::Commands::Acknowledge.call(device: command.device, kind: command.kind, data: {
      "message_id" => message_id, "status" => status, "payload" => payload
    })
  end

  before do
    travel_to Time.utc(2026, 9, 16, 10, 0, 0)
    allow(DeviceChannel).to receive(:broadcast_to)
  end

  after { travel_back }

  def schedule
    create(:watering_schedule, device:, active: true, day_of_week: Time.current.wday,
      start_time: "09:59", end_time: "10:02")
  end

  it "retries a lost start with the same ID without creating a second irrigation log" do
    schedule
    Devices::Watering::SyncSchedules.call(device:)
    command = device.device_commands.sole
    DeliverDeviceCommandJob.perform_now(command.id)
    travel 21.seconds
    Devices::Watering::SyncSchedules.call(device:)
    DeliverDeviceCommandJob.perform_now(command.id)

    expect(device.watering_logs.count).to eq(1)
    expect(command.reload.attempts).to eq(2)
    expect(DeviceChannel).to have_received(:broadcast_to).with(device, hash_including(message_id: command.id)).twice
    acknowledge(command)
    expect(device.watering_logs.sole).to be_running
  end

  it "retains an offline stop until a matching acknowledgement, and notifies only once" do
    schedule
    Devices::Watering::SyncSchedules.call(device:)
    start = device.device_commands.sole
    acknowledge(start)
    device.mark_disconnected!
    travel 3.minutes
    Devices::Watering::SyncSchedules.call(device:)
    stop = device.device_commands.pending.sole
    log = device.watering_logs.sole

    expect(log).to be_stopping
    expect(log.finished_at).to be_nil
    expect(device.notifications.where(kind: "irrigation_finished")).to be_empty
    DeliverDeviceCommandJob.perform_now(stop.id)
    expect(stop.reload.attempts).to eq(0)
    device.mark_connected!
    DeliverDeviceCommandJob.perform_now(stop.id)
    acknowledge(stop, message_id: start.id)
    expect(log.reload).to be_stopping
    acknowledge(stop)
    acknowledge(stop)
    expect(log.reload).to be_finished
    expect(log.water_used_liters).to be_nil
    expect(device.notifications.where(kind: "irrigation_finished").count).to eq(1)
  end

  it "supersedes an unconfirmed start when its schedule ends" do
    schedule
    Devices::Watering::SyncSchedules.call(device:)
    start = device.device_commands.sole
    travel 3.minutes
    Devices::Watering::SyncSchedules.call(device:)
    expect(start.reload).to be_superseded
    expect(device.device_commands.pending.sole.parameters).to eq("status" => "off")
    acknowledge(start)
    expect(device.watering_logs.sole).to be_stopping
  end

  it "renews a running pump lease without duplicating the log or started notification" do
    schedule
    Devices::Watering::SyncSchedules.call(device:)
    acknowledge(device.device_commands.sole)
    travel 16.seconds
    Devices::Watering::SyncSchedules.call(device:)
    renewal = device.device_commands.pending.sole
    acknowledge(renewal)
    expect(device.watering_logs.count).to eq(1)
    expect(device.notifications.where(kind: "irrigation_started").count).to eq(1)
  end

  it "caps a retried pump lease at the schedule end" do
    schedule
    Devices::Watering::SyncSchedules.call(device:)
    command = device.device_commands.sole
    travel 115.seconds
    device.mark_connected!
    DeliverDeviceCommandJob.perform_now(command.id)
    expect(DeviceChannel).to have_received(:broadcast_to).with(device,
      hash_including(payload: { command: "water_pump.update", params: { "status" => "on", "lease_seconds" => 5 } }))
  end

  it "accepts both-window confirmation after 11 seconds without blocking the request" do
    window = create(:window, device:)
    expect(Devices::Windows::RequestUpdate.call(device:, window:,
      params: { left_window_status: "open", right_window_status: "open" })).to eq([])
    command = device.device_commands.sole
    expect(command).to be_pending
    expect(window.reload.left_window_status).to eq("closed")
    DeliverDeviceCommandJob.perform_now(command.id)
    travel 11.seconds
    acknowledge(command)
    expect(command.reload).to be_confirmed
    expect(window.reload.left_window_status).to eq("open")
    expect(window.right_window_status).to eq("open")
  end

  it "preserves both window targets when clients submit overlapping updates" do
    window = create(:window, device:)
    Devices::Windows::RequestUpdate.call(device:, window:, params: { left_window_status: "open" })
    previous = device.device_commands.pending.sole
    DeliverDeviceCommandJob.perform_now(previous.id)
    travel 1.second
    Devices::Windows::RequestUpdate.call(device:, window:, params: { right_window_status: "open" })

    command = device.device_commands.pending.sole
    expect(previous.reload).to be_superseded
    expect(command.parameters).to eq("left_window_status" => "open", "right_window_status" => "open")
    acknowledge(previous)
    expect(window.reload.left_window_status).to eq("closed")
    acknowledge(command)
    expect(window.reload.left_window_status).to eq("open")
    expect(window.right_window_status).to eq("open")
  end

  it "allows reversing one pending window target while retaining the other" do
    window = create(:window, device:)
    Devices::Windows::RequestUpdate.call(device:, window:,
      params: { left_window_status: "open", right_window_status: "open" })
    Devices::Windows::RequestUpdate.call(device:, window:, params: { left_window_status: "closed" })

    command = device.device_commands.pending.sole
    expect(command.parameters).to eq("left_window_status" => "closed", "right_window_status" => "open")
    Devices::Windows::RequestUpdate.call(device:, window:, params: { left_window_status: "closed" })
    expect(device.device_commands.pending.sole.id).to eq(command.id)
    acknowledge(command)
    expect(window.reload.left_window_status).to eq("closed")
    expect(window.right_window_status).to eq("open")
  end

  it "reports missing manual-command confirmation without claiming the actuator changed" do
    fan = create(:fan, device:)
    Devices::Fans::RequestUpdate.call(device:, fan:, params: { status: "on" })
    command = device.device_commands.sole
    travel 91.seconds
    DeliverDeviceCommandJob.perform_now(command.id)
    expect(command.reload).to be_failed
    expect(command.error_code).to eq("confirmation_timeout")
    expect(fan.reload.status).to eq("off")
  end

  it "rejects a mismatched payload and duplicate delivery within the retry interval" do
    fan = create(:fan, device:)
    Devices::Fans::RequestUpdate.call(device:, fan:, params: { status: "on" })
    command = device.device_commands.sole
    2.times { DeliverDeviceCommandJob.perform_now(command.id) }
    expect(command.reload.attempts).to eq(1)
    acknowledge(command, payload: { "status" => "off" })
    expect(command.reload).to be_pending
    expect(fan.reload.status).to eq("off")
  end

  it "shares connection leases across instances and ignores an old socket disconnect" do
    old_token = device.mark_connected!
    fresh_instance = Device.find(device.id)
    expect(fresh_instance).to be_connected
    new_token = fresh_instance.mark_connected!
    device.mark_disconnected!(old_token)
    expect(device).to be_connected
    expect(device.mark_connected!(old_token)).to be(false)
    fresh_instance.mark_disconnected!(new_token)
    expect(device).not_to be_connected
  end
end
