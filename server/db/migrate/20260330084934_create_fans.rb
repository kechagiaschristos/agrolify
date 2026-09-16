class CreateFans < ActiveRecord::Migration[8.0]
  def change
    create_table :fans do |t|
      t.references :device, null: false, foreign_key: true, type: :uuid
      t.string :status, null: false, default: "off"
      t.string :mode, null: false, default: "manual"
      t.timestamps
    end
  end
end
