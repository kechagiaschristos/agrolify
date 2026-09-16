class CreateWateringLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :watering_logs do |t|
      t.references :device, null: false, foreign_key: true, type: :uuid

      t.datetime :started_at, null: false
      t.datetime :finished_at

      t.string :status, null: false
      t.integer :water_used_liters

      t.timestamps
    end
    add_index :watering_logs, [:device_id, :started_at]
  end
end
