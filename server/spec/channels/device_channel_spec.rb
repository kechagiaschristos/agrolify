require "rails_helper"

RSpec.describe DeviceChannel, type: :channel do
  let(:device) { create(:device) }

  before do
    stub_connection current_device: device
    allow(DeviceChannel).to receive(:broadcast_to)
  end

  it "reapplies a confirmed manual fan state after reconnecting" do
    fan = create(:fan, :on, device:)
    previous = device.device_commands.create!(kind: "fan.update", parameters: { status: "on", mode: "manual" }, status: "confirmed")

    subscribe

    expect(subscription).to be_confirmed
    command = device.device_commands.pending.sole
    expect(command.id).not_to eq(previous.id)
    expect(command.parameters).to eq("status" => "on", "mode" => "manual")
    DeliverDeviceCommandJob.perform_now(command.id)
    expect(DeviceChannel).to have_received(:broadcast_to).with(device, hash_including(message_id: command.id))
    perform :receive, { "type" => "fan.update", "message_id" => command.id, "status" => "ok", "payload" => command.parameters }
    expect(command.reload).to be_confirmed
    expect(fan.reload).to be_status_on
  end

  it "replaces an unacknowledged fan command so firmware cannot replay a cached pre-disconnect result" do
    fan = create(:fan, device:)
    Devices::Fans::RequestUpdate.call(device:, fan:, params: { status: "on" })
    previous = device.device_commands.pending.sole

    subscribe

    command = device.device_commands.pending.sole
    expect(previous.reload).to be_superseded
    expect(command.id).not_to eq(previous.id)
    expect(command.parameters).to eq("status" => "on", "mode" => "manual")
    expect(fan.reload).to be_status_off
    perform :receive, { "type" => "fan.update", "message_id" => previous.id, "status" => "ok", "payload" => previous.parameters }
    expect(command.reload).to be_pending
    expect(fan.reload).to be_status_off
  end

  it "preserves a pending manual stop instead of restoring the last confirmed on state" do
    fan = create(:fan, :on, device:)
    Devices::Fans::RequestUpdate.call(device:, fan:, params: { status: "off" })

    subscribe

    expect(device.device_commands.pending.sole.parameters).to eq("status" => "off", "mode" => "manual")
  end

  it "reevaluates automatic fan control using the latest measurement on reconnect" do
    create(:fan, :on, :auto, device:)
    create(:measurement, :cold, device:)

    subscribe

    expect(device.device_commands.pending.sole.parameters).to eq("status" => "off", "mode" => "auto")
  end

  it "accepts devices without a fan" do
    subscribe

    expect(subscription).to be_confirmed
    expect(device.device_commands).to be_empty
  end
end
