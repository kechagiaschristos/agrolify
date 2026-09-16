class CreateDevices < ActiveRecord::Migration[8.0]
  def change
    create_table :devices, id: :uuid do |t|
      t.references :user, null: true, type: :uuid, foreign_key: true
      t.string :code, null: false
      t.string :name, null: false
      t.text :description
      t.integer :temperature_air_min_c, null: false, default: 18
      t.integer :temperature_air_max_c, null: false, default: 28
      t.integer :ventilation_temperature_min_c, null: false, default: 20
      t.integer :ventilation_temperature_max_c, null: false, default: 26
      t.integer :water_tank_capacity_liters, null: false, default: 50
      t.string :temperature_unit, null: false, default: "cel"
      t.string :liquid_unit, null: false, default: "liters"
      t.string :token, null:false
      t.timestamps
    end
    add_index :devices, :name
    add_index :devices, :code, unique: true
    add_index :devices, :token, unique: true
  end
end
