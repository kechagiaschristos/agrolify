class JsonWebToken
  ALGORITHM = 'HS256'

  class << self
    def encode(payload, exp = 24.hours.from_now)
      payload[:exp] = exp.to_i
      JWT.encode(payload, secret, ALGORITHM)
    end

    def decode(token)
      decoded = JWT.decode(token, secret, true, {algorithm: ALGORITHM})[0]
      HashWithIndifferentAccess.new(decoded)
    end

    private

    def secret
      ENV.fetch("JWT_SECRET")
    end
  end
end
