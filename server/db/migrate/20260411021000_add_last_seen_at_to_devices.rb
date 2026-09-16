class AddLastSeenAtToDevices < ActiveRecord::Migration[8.0]
  def change
    add_column :devices, :last_seen_at, :datetime
    add_index :devices, :last_seen_at
  end
end
