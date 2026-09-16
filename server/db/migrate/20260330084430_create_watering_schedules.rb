class CreateWateringSchedules < ActiveRecord::Migration[8.0]
  def change
    create_table :watering_schedules do |t|
      t.references :device, null: false, foreign_key: true, type: :uuid

      t.integer :day_of_week, null: false

      t.time :start_time, null: false
      t.time :end_time, null: false
      t.boolean :active, default: false
      t.timestamps
    end
    add_index :watering_schedules, [:device_id, :day_of_week]
  end
end
