class CreateMeasurements < ActiveRecord::Migration[8.0]
  def change
    create_table :measurements do |t|
      t.references :device, null: false, foreign_key: true, type: :uuid

      t.decimal :air_temperature_c, precision: 5, scale: 1
      t.decimal :air_humidity, precision: 4, scale: 1
      t.decimal :soil_temperature_c, precision: 5, scale: 1
      t.decimal :soil_moisture, precision: 4, scale: 1

      t.decimal :gps_latitude, precision: 9, scale: 6
      t.decimal :gps_longitude, precision: 9, scale: 6

      t.integer :water_level_liters

      t.timestamps
    end

    add_index :measurements, [:device_id, :created_at]
  end
end
