#include "sensors.h"
#include <Arduino.h>
#include <WiFi.h>

#define RELAY_PIN_FAN 26
#define RELAY_PIN_WATER_PUMP 27

void disableRelayOutputs() {
  digitalWrite(RELAY_PIN_FAN, HIGH);
  digitalWrite(RELAY_PIN_WATER_PUMP, HIGH);
}

void setupRelay() {
  pinMode(RELAY_PIN_FAN, OUTPUT);
  pinMode(RELAY_PIN_WATER_PUMP, OUTPUT);
  disableRelayOutputs();
}

bool fan(const JsonObjectConst &fans) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi is disconnected, fan remains disabled");
    disableRelayOutputs();
    return false;
  }

  const char* status = fans["status"];
  if (status == NULL) {
    Serial.println("Missing fan status");
    return false;
  }
  
  if (strcmp(status, "on") == 0 || strcmp(status, "open") == 0) {
    Serial.println("Turning ON Fan");
    digitalWrite(RELAY_PIN_FAN, LOW);        
    return true;
  } 
  else if (strcmp(status, "off") == 0 || strcmp(status, "closed") == 0) {
    Serial.println("Turning OFF Fan");
    digitalWrite(RELAY_PIN_FAN, HIGH);       
    return true;
  }
  else {
    Serial.println("Unknown fan status or loading...");
    return false;
  }
}

bool waterPump(const JsonObjectConst &waterPump) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi is disconnected, water pump remains disabled");
    disableRelayOutputs();
    return false;
  }

  JsonVariantConst statusValue = waterPump["status"];
  if (statusValue.isNull()) {
    Serial.println("Missing water pump status");
    return false;
  }

  if (statusValue.is<const char*>()) {
    const char* status = statusValue.as<const char*>();
    if (strcmp(status, "on") == 0) {
      Serial.println("Turning ON WaterPump");
      digitalWrite(RELAY_PIN_WATER_PUMP, LOW);
      return true;
    }

    if (strcmp(status, "off") == 0) {
      Serial.println("Turning OFF WaterPump");
      digitalWrite(RELAY_PIN_WATER_PUMP, HIGH);
      return true;
    }
  }

  bool status = statusValue.as<bool>();

  if (status == 1) {
    Serial.println("Turning ON WaterPump");
    digitalWrite(RELAY_PIN_WATER_PUMP, LOW);
    return true;
  } 
  else if (status == 0) {
    Serial.println("Turning OFF WaterPump");
    digitalWrite(RELAY_PIN_WATER_PUMP, HIGH);
    return true;
  }

  return false;
}
