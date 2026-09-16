class AddTimeZoneToDevices < ActiveRecord::Migration[8.0]
  def change
    add_column :devices, :time_zone, :string, null: false, default: "UTC"
  end
end
