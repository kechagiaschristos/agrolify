class CreateWindows < ActiveRecord::Migration[8.0]
  def change
    create_table :windows do |t|
      t.references :device, null: false, foreign_key: true, type: :uuid

      t.string :left_window_status, null: false, default: "closed"
      t.string :left_window_mode, null: false, default: "manual"

      t.string :right_window_status, null: false, default: "closed"
      t.string :right_window_mode, null: false, default: "manual"

      t.timestamps
    end
  end
end
