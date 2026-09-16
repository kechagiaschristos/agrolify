class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :username, null: false
      t.string :email, null: false
      t.string :selected_device_code
      t.string :password_digest, null: false
      t.string :theme, default: "light", null: false
      t.string :avatar
      t.string :locale, default: "en", null: false
      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :username, unique: true
  end
end