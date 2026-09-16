class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :device, null:false, foreign_key: true, type: :uuid
      t.string :kind, null: false
      t.string :title, null: false
      t.text :message, null: false
      t.datetime :read_at
      t.timestamps
    end
  end
end
