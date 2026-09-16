class AddDurableDeviceCommands < ActiveRecord::Migration[8.0]
  def change
    add_column :devices, :connection_token, :string
    add_column :devices, :connected_until, :datetime

    create_table :device_commands, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :device, type: :uuid, null: false, foreign_key: true
      t.references :watering_log, foreign_key: true
      t.string :kind, null: false
      t.jsonb :parameters, null: false, default: {}
      t.string :status, null: false, default: "pending"
      t.integer :attempts, null: false, default: 0
      t.datetime :last_sent_at
      t.datetime :expires_at
      t.datetime :confirmed_at
      t.string :error_code
      t.timestamps
    end
    add_index :device_commands, [ :device_id, :kind ], unique: true,
      where: "status = 'pending'", name: "index_device_commands_pending_kind"
    add_index :device_commands, [ :status, :last_sent_at ]
  end
end
