class RemoveWindowModesFromWindows < ActiveRecord::Migration[8.0]
  def change
    remove_column :windows, :left_window_mode, :string
    remove_column :windows, :right_window_mode, :string
  end
end
