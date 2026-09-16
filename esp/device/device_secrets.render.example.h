#pragma once

// Render production example.
// Copy this file to device_secrets.h and fill in your WiFi and Rails device token.
// Keep device_secrets.h private.

#define DEVICE_WIFI_SSID "REPLACE_WITH_WIFI_SSID"
#define DEVICE_WIFI_PASSWORD "REPLACE_WITH_WIFI_PASSWORD"

// Use the direct Render server until api.agrolify.com has a valid SSL certificate in Render.
// If you switch the host to api.agrolify.com later, also change the origin to https://api.agrolify.com.
#define DEVICE_WEBSOCKET_HOST "agrolify-server.onrender.com"
#define DEVICE_WEBSOCKET_PORT 443
#define DEVICE_WEBSOCKET_PATH "/cable"
#define DEVICE_WEBSOCKET_USE_TLS true
#define DEVICE_WEBSOCKET_ORIGIN "https://agrolify-server.onrender.com"

// This must match the token for the Rails Device record, for example code greenh-main.
#define DEVICE_TOKEN "REPLACE_WITH_DEVICE_TOKEN"

#define DEVICE_WATER_TANK_CAPACITY_LITERS 80
