#include <ArduinoJson.h>
#include "sensors.h"
#include <Arduino.h>

int motor1Pin1 = 12;
int motor1Pin2 = 14;
int motor1Pin3 = 15;
int motor1Pin4 = 4;
bool leftWindowState;
bool rightWindowState;

// Keep checking the pump lease during motor travel without re-entering WebSocket callbacks.
bool waitForWindowTravel() {
  unsigned long startedAt = millis();
  while (millis() - startedAt < 5400UL) {
    if (!enforceActuatorSafety()) return false;
    delay(10);
  }
  return true;
}

void stopWindows() {
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor1Pin3, LOW);
  digitalWrite(motor1Pin4, LOW);
}

void setupWindows() {
  pinMode(motor1Pin1, OUTPUT);
  pinMode(motor1Pin2, OUTPUT);
  pinMode(motor1Pin3, OUTPUT);
  pinMode(motor1Pin4, OUTPUT);
  stopWindows();
}

bool windows(const JsonObject& windows) {
  const char* window = windows["windows"];
  const char* status = windows["status"];

  if (window == NULL || status == NULL) {
    Serial.println("Invalid JSON received");
    return false;
  }

  Serial.print("Window: ");
  Serial.print(window);
  Serial.print(", Status: ");
  Serial.println(status);

  if (strcmp(window, "right") == 0) {
    if (strcmp(status, "open") == 0) {
      Serial.println("Opening right window");
      digitalWrite(motor1Pin1, LOW);
      digitalWrite(motor1Pin2, HIGH);
      if (!waitForWindowTravel()) return false;
      digitalWrite(motor1Pin1, LOW);
      digitalWrite(motor1Pin2, LOW);
      return true;
    } else if (strcmp(status, "closed") == 0) {
      Serial.println("Closing right window");
      digitalWrite(motor1Pin1, HIGH);
      digitalWrite(motor1Pin2, LOW);
      if (!waitForWindowTravel()) return false;
      digitalWrite(motor1Pin1, LOW);
      digitalWrite(motor1Pin2, LOW);
      return true;
    }
  } else if (strcmp(window, "left") == 0) {
    if (strcmp(status, "open") == 0) {
      Serial.println("Opening left window");
      digitalWrite(motor1Pin3, HIGH);
      digitalWrite(motor1Pin4, LOW);
      if (!waitForWindowTravel()) return false;
      digitalWrite(motor1Pin3, LOW);
      digitalWrite(motor1Pin4, LOW);
      return true;
    } else if (strcmp(status, "closed") == 0) {
      Serial.println("Closing left window");
      digitalWrite(motor1Pin3, LOW);
      digitalWrite(motor1Pin4, HIGH);
      if (!waitForWindowTravel()) return false;
      digitalWrite(motor1Pin3, LOW);
      digitalWrite(motor1Pin4, LOW);
      return true;
    }
  }

  Serial.println("Invalid window or status");
  return false;
}
