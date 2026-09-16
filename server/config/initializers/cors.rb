frontend_origins = ENV.fetch("FRONTEND_URL", "")
  .split(",")
  .map { |origin| origin.strip.delete_suffix("/") }
  .reject(&:blank?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      %r{\Ahttps?://localhost(?::\d+)?\z},
      %r{\Ahttps?://127\.0\.0\.1(?::\d+)?\z},
      %r{\Ahttps?://\[::1\](?::\d+)?\z},
      %r{\Ahttps?://192\.168\.\d+\.\d+(?::\d+)?\z},
      *frontend_origins
    )

    resource "*",
      headers: :any,
      credentials: true,
      methods: %i[get post put patch delete options head]
  end
end
