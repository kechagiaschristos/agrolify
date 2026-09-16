module Devices
  module Watering
    class HandleUpdate
      def self.call(device:, data:)
        Devices::Commands::Acknowledge.call(device:, data:, kind: "water_pump.update")
      end
    end
  end
end
