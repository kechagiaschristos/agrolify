module Devices
  module Windows
    class RequestUpdate
      def self.call(device:, window:, params:)
        device.with_lock do
          window.reload
          requested = params.to_h.symbolize_keys.slice(*Window::STATUS_ATTRIBUTES).transform_values(&:to_s)
          return [ "Window status is invalid" ] unless requested.values.all? { |status| %w[open closed].include?(status) }
          return [] if requested.empty?

          pending = device.device_commands.pending.find_by(kind: "window.update")
          changed = requested.reject { |attribute, status| window.public_send(attribute) == status }
          if pending || changed.any?
            parameters = pending ? pending.parameters.symbolize_keys.merge(requested) : changed
            DeviceCommand.submit!(device:, kind: "window.update", parameters:)
          end
          []
        end
      end
    end
  end
end
