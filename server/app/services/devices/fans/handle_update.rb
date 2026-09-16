module Devices
  module Fans
    class HandleUpdate
      def self.call(device:, data:)
        Devices::Commands::Acknowledge.call(device:, data:, kind: "fan.update")
      end
    end
  end
end
