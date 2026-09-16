#pragma once

// Local Rails development example.
// Copy this file to device_secrets.h and fill in your WiFi and Rails device token.
// Keep device_secrets.h private.

#define DEVICE_WIFI_SSID "REPLACE_WITH_WIFI_SSID"
#define DEVICE_WIFI_PASSWORD "REPLACE_WITH_WIFI_PASSWORD"

// Use the LAN IP of the computer running Rails, not localhost.
// If your computer IP changes, update both host and origin.
#define DEVICE_WEBSOCKET_HOST "192.168.1.15"
#define DEVICE_WEBSOCKET_PORT 3000
#define DEVICE_WEBSOCKET_PATH "/cable"
#define DEVICE_WEBSOCKET_USE_TLS false
#define DEVICE_WEBSOCKET_ORIGIN "http://192.168.1.15:3000"

// This must match the token for the Rails Device record, for example code greenh-main.
#define DEVICE_TOKEN "REPLACE_WITH_DEVICE_TOKEN"

#define DEVICE_WATER_TANK_CAPACITY_LITERS 80
