#include <WiFi.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <esp_system.h>
#include <time.h>
#include <string.h>
#include "sensors.h"

#if __has_include("device_secrets.h")
#include "device_secrets.h"
#else
#define DEVICE_WIFI_SSID "REPLACE_WITH_WIFI_SSID"
#define DEVICE_WIFI_PASSWORD "REPLACE_WITH_WIFI_PASSWORD"
#define DEVICE_WEBSOCKET_HOST "agrolify-server.onrender.com"
#define DEVICE_WEBSOCKET_PORT 443
#define DEVICE_WEBSOCKET_PATH "/cable"
#define DEVICE_WEBSOCKET_USE_TLS true
#define DEVICE_WEBSOCKET_ORIGIN "https://agrolify-server.onrender.com"
#define DEVICE_TOKEN "REPLACE_WITH_DEVICE_TOKEN"
#define DEVICE_WATER_TANK_CAPACITY_LITERS 80
#endif

#ifndef DEVICE_WIFI_SSID
#define DEVICE_WIFI_SSID "REPLACE_WITH_WIFI_SSID"
#endif

#ifndef DEVICE_WIFI_PASSWORD
#define DEVICE_WIFI_PASSWORD "REPLACE_WITH_WIFI_PASSWORD"
#endif

#ifndef DEVICE_WEBSOCKET_HOST
#define DEVICE_WEBSOCKET_HOST "agrolify-server.onrender.com"
#endif

#ifndef DEVICE_WEBSOCKET_PORT
#define DEVICE_WEBSOCKET_PORT 443
#endif

#ifndef DEVICE_WEBSOCKET_PATH
#define DEVICE_WEBSOCKET_PATH "/cable"
#endif

#ifndef DEVICE_WEBSOCKET_USE_TLS
#define DEVICE_WEBSOCKET_USE_TLS true
#endif

#ifndef DEVICE_WEBSOCKET_ORIGIN
#define DEVICE_WEBSOCKET_ORIGIN "https://agrolify-server.onrender.com"
#endif

#ifndef DEVICE_TOKEN
#define DEVICE_TOKEN "REPLACE_WITH_DEVICE_TOKEN"
#endif

#ifndef DEVICE_WATER_TANK_CAPACITY_LITERS
#define DEVICE_WATER_TANK_CAPACITY_LITERS 80
#endif

WebSocketsClient webSocket;
bool actionCableReady = false;
bool deviceChannelSubscribed = false;
unsigned long pumpLeaseDeadline = 0;
String completedCommandIds[16];
String completedCommandResults[16];
uint8_t completedCommandIndex = 0;
int airTemperatureCel;
int airTemperatureFah;
int soilTemperatureCel;
int soilTemperatureFah;
int airHumidity;
float latitude;
float longitude;
int soilMoisture;
int waterLevelPercent;

unsigned long timerDelay = 30000;
unsigned long lastTime = 0;

String sensorReadings;
String websocketExtraHeaders;
const char* ssid = DEVICE_WIFI_SSID;
const char* password = DEVICE_WIFI_PASSWORD;
const char* websocketHost = DEVICE_WEBSOCKET_HOST;
const uint16_t websocketPort = DEVICE_WEBSOCKET_PORT;
const char* websocketPath = DEVICE_WEBSOCKET_PATH;
const bool websocketUseTls = DEVICE_WEBSOCKET_USE_TLS;
const char* websocketOrigin = DEVICE_WEBSOCKET_ORIGIN;
const char* deviceToken = DEVICE_TOKEN;
const char* deviceChannelIdentifier = "{\"channel\":\"DeviceChannel\"}";
const int waterTankCapacityLiters = DEVICE_WATER_TANK_CAPACITY_LITERS;

bool isPlaceholderValue(const char* value);
bool deviceConfigurationValid();
void haltForInvalidConfiguration();
void connectWifi();
void syncClock();
void connectActionCable();
void sendMeasurementMessage();
void subscribeToDeviceChannel();
void sendActionCableMessage(DynamicJsonDocument& message);
void handleWebSocketMessage(const char* payload, size_t length);
bool executeCommand(const char* command, const JsonObjectConst& params);
bool executeWindowUpdate(const JsonObjectConst& params);
String buildMessageId(const char* prefix);
String isoTimestamp();
void appendCommandResultPayload(const char* command, const JsonObjectConst& params, JsonObject payload);
const char* responseTypeForCommand(const char* command);
int waterLevelPercentToLiters(int waterLevelPercentValue);
void sendCommandResult(const char* messageId, const char* command, bool ok, const JsonObjectConst* resultPayload = nullptr, const char* errorCode = nullptr, const char* errorMessage = nullptr);
void sendProtocolError(const char* messageId, const char* code, const char* message);
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length);

void setup() {
  Serial.begin(115200);
  setupRelay();
  setupWindows();

  if (!deviceConfigurationValid()) {
    haltForInvalidConfiguration();
  }

  connectWifi();
  syncClock();

  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  webSocket.enableHeartbeat(15000, 3000, 2);
  connectActionCable();

  setupAirSensors();
  setupSoilSensors();
  setupWaterSensors();
  // setupLcd();
  setupGps();
}

void loop() {
  webSocket.loop();
  enforceActuatorSafety();

  if ((millis() - lastTime) > timerDelay) {
    if (WiFi.status() == WL_CONNECTED) {
      sendMeasurementMessage();
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}

bool enforceActuatorSafety() {
  if (WiFi.status() != WL_CONNECTED || !webSocket.isConnected() || !deviceChannelSubscribed) {
    disableRelayOutputs();
    stopWindows();
    pumpLeaseDeadline = 0;
    return false;
  } else if (pumpLeaseDeadline != 0 && (long)(millis() - pumpLeaseDeadline) >= 0) {
    DynamicJsonDocument stopDoc(64);
    stopDoc["status"] = "off";
    waterPump(stopDoc.as<JsonObjectConst>());
    pumpLeaseDeadline = 0;
  }

  return true;
}

bool isPlaceholderValue(const char* value) {
  return value == nullptr || strlen(value) == 0 || strstr(value, "REPLACE_WITH") != nullptr;
}

bool deviceConfigurationValid() {
  if (isPlaceholderValue(ssid) || isPlaceholderValue(password)) {
    Serial.println("Invalid WiFi configuration. Create esp/device/device_secrets.h and set your WiFi values.");
    return false;
  }

  if (isPlaceholderValue(websocketHost) || isPlaceholderValue(websocketPath)) {
    Serial.println("Invalid WebSocket configuration. Check the Render server host and cable path.");
    return false;
  }

  if (websocketPort == 0) {
    Serial.println("Invalid WebSocket configuration. Port cannot be zero.");
    return false;
  }

  if (isPlaceholderValue(deviceToken)) {
    Serial.println("Invalid device token. Use the token from the Rails Device record.");
    return false;
  }

  return true;
}

void haltForInvalidConfiguration() {
  Serial.println("Device halted due to invalid configuration.");

  while (true) {
    delay(1000);
  }
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println("Connected to WiFi");
}

void syncClock() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void connectActionCable() {
  String websocketPathWithToken = String(websocketPath) + "?token=" + deviceToken;

  if (!isPlaceholderValue(websocketOrigin)) {
    websocketExtraHeaders = String("Origin: ") + websocketOrigin;
    webSocket.setExtraHeaders(websocketExtraHeaders.c_str());
  }

  Serial.printf(
    "Connecting Action Cable to %s://%s:%u%s\n",
    websocketUseTls ? "wss" : "ws",
    websocketHost,
    websocketPort,
    websocketPath
  );

  if (websocketUseTls) {
    webSocket.beginSSL(websocketHost, websocketPort, websocketPathWithToken.c_str());
  } else {
    webSocket.begin(websocketHost, websocketPort, websocketPathWithToken.c_str());
  }
}

String buildMessageId(const char* prefix) {
  String suffix = String(millis()) + "-" + String((uint32_t)esp_random(), HEX);
  return String(prefix) + "-" + suffix;
}

String isoTimestamp() {
  time_t now = time(nullptr);
  if (now < 100000) {
    return "";
  }

  struct tm timeInfo;
  gmtime_r(&now, &timeInfo);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
}

int waterLevelPercentToLiters(int waterLevelPercentValue) {
  if (waterLevelPercentValue < 0) {
    waterLevelPercentValue = 0;
  } else if (waterLevelPercentValue > 100) {
    waterLevelPercentValue = 100;
  }

  return (waterLevelPercentValue * waterTankCapacityLiters) / 100;
}

void sendMeasurementMessage() {
  if (!webSocket.isConnected() || !deviceChannelSubscribed) {
    Serial.println("Action Cable not ready, measurement skipped");
    return;
  }

  DynamicJsonDocument payloadDoc(512);

  getAirTemperature(&airTemperatureCel, &airTemperatureFah);
  getAirHumidity(&airHumidity);
  getSoilTemperature(&soilTemperatureCel, &soilTemperatureFah);
  getSoilMoisture(&soilMoisture);
  getWaterLevel(&waterLevelPercent);
  getGps(&latitude, &longitude);
  updateLcd(airTemperatureCel, airTemperatureFah, airHumidity, soilTemperatureCel, soilTemperatureFah, soilMoisture, waterLevelPercent);

  payloadDoc["action"] = "receive";
  payloadDoc["type"] = "measurement.create";
  payloadDoc["message_id"] = buildMessageId("measurement");

  String sentAt = isoTimestamp();
  if (sentAt.length() > 0) {
    payloadDoc["sent_at"] = sentAt;
  }

  JsonObject payload = payloadDoc.createNestedObject("payload");
  if (airTemperatureCel > -100 && airTemperatureCel < 100) {
    payload["air_temperature_c"] = airTemperatureCel;
  } else {
    payload["air_temperature_c"] = nullptr;
  }

  if (airHumidity >= 0 && airHumidity <= 100) {
    payload["air_humidity"] = airHumidity;
  } else {
    payload["air_humidity"] = nullptr;
  }

  if (soilTemperatureCel > -100 && soilTemperatureCel < 100) {
    payload["soil_temperature_c"] = soilTemperatureCel;
  } else {
    payload["soil_temperature_c"] = nullptr;
  }

  if (soilMoisture >= 0 && soilMoisture <= 100) {
    payload["soil_moisture"] = soilMoisture;
  } else {
    payload["soil_moisture"] = nullptr;
  }

  payload["water_level_liters"] = waterLevelPercentToLiters(waterLevelPercent);
  if (latitude != 0) {
    payload["gps_latitude"] = latitude;
  } else {
    payload["gps_latitude"] = nullptr;
  }

  if (longitude != 0) {
    payload["gps_longitude"] = longitude;
  } else {
    payload["gps_longitude"] = nullptr;
  }

  sendActionCableMessage(payloadDoc);
}

void appendCommandResultPayload(const char* command, const JsonObjectConst& params, JsonObject payload) {
  if (command == nullptr) {
    return;
  }

  if (strcmp(command, "fan.update") == 0) {
    const char* status = params["status"];
    const char* mode = params["mode"];

    if (status != nullptr) {
      payload["status"] = status;
    }

    if (mode != nullptr) {
      payload["mode"] = mode;
    }

    return;
  }

  if (strcmp(command, "window.update") == 0) {
    const char* leftStatus = params["left_window_status"];
    const char* rightStatus = params["right_window_status"];
    const char* window = params["window"];
    const char* status = params["status"];

    if (leftStatus != nullptr) {
      payload["left_window_status"] = leftStatus;
    }

    if (rightStatus != nullptr) {
      payload["right_window_status"] = rightStatus;
    }

    if (window != nullptr) {
      payload["window"] = window;
    }

    if (status != nullptr) {
      payload["status"] = status;
    }

    return;
  }

  if (strcmp(command, "water_pump.update") == 0) {
    JsonVariantConst status = params["status"];
    if (!status.isNull()) {
      payload["status"] = status;
    }
  }
}

const char* responseTypeForCommand(const char* command) {
  if (command == nullptr) {
    return "command.result";
  }

  return command;
}

void sendCommandResult(const char* messageId, const char* command, bool ok, const JsonObjectConst* resultPayload, const char* errorCode, const char* errorMessage) {
  DynamicJsonDocument response(512);
  response["action"] = "receive";
  response["type"] = responseTypeForCommand(command);
  String resolvedMessageId = messageId ? String(messageId) : buildMessageId("command-result");
  response["message_id"] = resolvedMessageId;
  response["status"] = ok ? "ok" : "failed";

  JsonObject payload = response.createNestedObject("payload");
  if (resultPayload != nullptr) {
    for (JsonPairConst pair : *resultPayload) {
      payload[pair.key().c_str()] = pair.value();
    }
  }

  if (!ok && errorCode != nullptr && errorMessage != nullptr) {
    JsonObject error = response.createNestedObject("error");
    error["code"] = errorCode;
    error["message"] = errorMessage;
  }

  if (ok && messageId != nullptr) {
    completedCommandIds[completedCommandIndex] = messageId;
    completedCommandResults[completedCommandIndex] = "";
    serializeJson(response, completedCommandResults[completedCommandIndex]);
    completedCommandIndex = (completedCommandIndex + 1) % 16;
  }
  sendActionCableMessage(response);
}

void sendProtocolError(const char* messageId, const char* code, const char* message) {
  DynamicJsonDocument response(512);
  response["action"] = "receive";
  response["type"] = "error";
  String resolvedMessageId = messageId ? String(messageId) : buildMessageId("error");
  response["message_id"] = resolvedMessageId;
  response["status"] = "invalid";

  JsonObject error = response.createNestedObject("error");
  error["code"] = code;
  error["message"] = message;

  sendActionCableMessage(response);
}

void subscribeToDeviceChannel() {
  DynamicJsonDocument subscribeCommand(256);
  subscribeCommand["command"] = "subscribe";
  subscribeCommand["identifier"] = deviceChannelIdentifier;

  String output;
  serializeJson(subscribeCommand, output);
  webSocket.sendTXT(output);
  Serial.println("Action Cable subscribe sent: " + output);
}

void sendActionCableMessage(DynamicJsonDocument& message) {
  if (!webSocket.isConnected() || !deviceChannelSubscribed) {
    Serial.println("Action Cable message skipped because channel is not subscribed");
    return;
  }

  String data;
  serializeJson(message, data);

  DynamicJsonDocument envelope(1024);
  envelope["command"] = "message";
  envelope["identifier"] = deviceChannelIdentifier;
  envelope["data"] = data;

  String output;
  serializeJson(envelope, output);
  webSocket.sendTXT(output);
  Serial.println("Action Cable message sent: " + output);
}

bool executeWindowUpdate(const JsonObjectConst& params) {
  bool executed = false;
  bool ok = true;

  const char* leftStatus = params["left_window_status"];
  if (leftStatus != nullptr) {
    DynamicJsonDocument leftDoc(128);
    JsonObject leftWindow = leftDoc.to<JsonObject>();
    leftWindow["windows"] = "left";
    leftWindow["status"] = leftStatus;
    executed = true;
    ok = windows(leftWindow) && ok;
  }

  const char* rightStatus = params["right_window_status"];
  if (rightStatus != nullptr) {
    DynamicJsonDocument rightDoc(128);
    JsonObject rightWindow = rightDoc.to<JsonObject>();
    rightWindow["windows"] = "right";
    rightWindow["status"] = rightStatus;
    executed = true;
    ok = windows(rightWindow) && ok;
  }

  const char* singleWindow = params["window"];
  const char* singleStatus = params["status"];
  if (!executed && singleWindow != nullptr && singleStatus != nullptr) {
    DynamicJsonDocument singleDoc(128);
    JsonObject singleCommand = singleDoc.to<JsonObject>();
    singleCommand["windows"] = singleWindow;
    singleCommand["status"] = singleStatus;
    executed = true;
    ok = windows(singleCommand) && ok;
  }

  return executed && ok;
}

bool executeCommand(const char* command, const JsonObjectConst& params) {
  if (command == nullptr) {
    return false;
  }

  if (strcmp(command, "window.update") == 0) {
    return executeWindowUpdate(params);
  }

  if (strcmp(command, "fan.update") == 0) {
    return fan(params);
  }

  if (strcmp(command, "water_pump.update") == 0) {
    const char* status = params["status"];
    if (status == nullptr || (strcmp(status, "on") != 0 && strcmp(status, "off") != 0)) return false;
    unsigned long leaseSeconds = params["lease_seconds"] | 0UL;
    if (strcmp(status, "on") == 0 && (leaseSeconds == 0 || leaseSeconds > 45)) return false;
    if (!waterPump(params)) return false;
    pumpLeaseDeadline = strcmp(status, "on") == 0 ? millis() + leaseSeconds * 1000UL : 0;
    return true;
  }

  return false;
}

void handleWebSocketMessage(const char* payload, size_t length) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    sendProtocolError(nullptr, "INVALID_JSON", "Could not parse WebSocket payload");
    return;
  }

  const char* frameType = doc["type"];
  const char* identifier = doc["identifier"];

  if (frameType != nullptr) {
    if (strcmp(frameType, "welcome") == 0) {
      actionCableReady = true;
      Serial.println("Action Cable welcome received");
      subscribeToDeviceChannel();
      return;
    }

    if (strcmp(frameType, "ping") == 0) {
      Serial.println("Action Cable ping received");
      return;
    }

    if (strcmp(frameType, "confirm_subscription") == 0) {
      if (identifier != nullptr && strcmp(identifier, deviceChannelIdentifier) == 0) {
        deviceChannelSubscribed = true;
        Serial.println("DeviceChannel subscription confirmed");
      }
      return;
    }

    if (strcmp(frameType, "reject_subscription") == 0) {
      deviceChannelSubscribed = false;
      Serial.println("DeviceChannel subscription rejected");
      return;
    }

    if (strcmp(frameType, "disconnect") == 0) {
      deviceChannelSubscribed = false;
      actionCableReady = false;
      const char* reason = doc["reason"];
      Serial.println(String("Action Cable disconnect: ") + (reason ? reason : "unknown"));
      return;
    }
  }

  JsonVariantConst messageVariant = doc["message"];
  if (messageVariant.isNull()) {
    Serial.println("Ignoring Action Cable frame without message payload");
    return;
  }

  JsonObjectConst message = messageVariant.as<JsonObjectConst>();
  const char* type = message["type"];
  const char* messageId = message["message_id"];

  if (type == nullptr) {
    Serial.println("Ignoring channel message without type");
    return;
  }

  if (strcmp(type, "ack") == 0) {
    Serial.println("Received ACK from server");
    return;
  }

  if (strcmp(type, "error") == 0) {
    const char* errorMessage = message["error"]["message"];
    Serial.println(String("Server error: ") + (errorMessage ? errorMessage : "unknown"));
    return;
  }

  if (strcmp(type, "command.execute") != 0) {
    sendProtocolError(messageId, "UNSUPPORTED_TYPE", "Unsupported message type");
    return;
  }

  JsonObjectConst commandPayload = message["payload"].as<JsonObjectConst>();
  if (commandPayload.isNull()) {
    sendCommandResult(messageId, nullptr, false, nullptr, "MISSING_PAYLOAD", "Command payload is required");
    return;
  }

  const char* command = commandPayload["command"];
  JsonObjectConst params = commandPayload["params"].as<JsonObjectConst>();

  if (command == nullptr) {
    sendCommandResult(messageId, nullptr, false, nullptr, "MISSING_COMMAND", "Command name is required");
    return;
  }

  if (params.isNull()) {
    sendCommandResult(messageId, command, false, nullptr, "MISSING_PARAMS", "Command params are required");
    return;
  }

  if (messageId == nullptr || strlen(messageId) == 0) {
    sendProtocolError(nullptr, "MISSING_MESSAGE_ID", "Command message ID is required");
    return;
  }
  for (uint8_t index = 0; index < 16; index++) {
    if (completedCommandIds[index] != messageId) continue;
    if (strcmp(command, "water_pump.update") == 0 && strcmp(params["status"] | "", "on") == 0
        && (pumpLeaseDeadline == 0 || (long)(millis() - pumpLeaseDeadline) >= 0)) {
      sendCommandResult(messageId, command, false, nullptr, "LEASE_EXPIRED", "Watering lease expired");
    } else {
      DynamicJsonDocument cachedResult(512);
      if (!deserializeJson(cachedResult, completedCommandResults[index])) sendActionCableMessage(cachedResult);
    }
    return;
  }
  bool ok = executeCommand(command, params);
  if (ok) {
    DynamicJsonDocument resultDoc(256);
    JsonObject resultPayload = resultDoc.to<JsonObject>();
    appendCommandResultPayload(command, params, resultPayload);
    JsonObjectConst resultPayloadConst = resultPayload;
    sendCommandResult(messageId, command, true, &resultPayloadConst);
  } else {
    sendCommandResult(messageId, command, false, nullptr, "COMMAND_FAILED", "Command execution failed");
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      actionCableReady = false;
      deviceChannelSubscribed = false;
      disableRelayOutputs();
      stopWindows();
      pumpLeaseDeadline = 0;
      Serial.println("[WS] Disconnected");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to: %s\n", payload);
      break;
    case WStype_TEXT:
      Serial.printf("[WS] Received text: %s\n", payload);
      handleWebSocketMessage(reinterpret_cast<const char*>(payload), length);
      break;
    case WStype_ERROR:
      Serial.println("[WS] Error");
      break;
    case WStype_BIN:
      Serial.printf("[WS] Unsupported binary payload: %u\n", length);
      break;
    case WStype_PING:
      Serial.println("[WS] Ping received");
      break;
    case WStype_PONG:
      Serial.println("[WS] Pong received");
      break;
    default:
      break;
  }
}
