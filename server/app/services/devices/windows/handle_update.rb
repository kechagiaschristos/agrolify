module Devices
  module Windows
    class HandleUpdate
      def self.call(device:, data:)
        Devices::Commands::Acknowledge.call(device:, data:, kind: "window.update")
      end
    end
  end
end
