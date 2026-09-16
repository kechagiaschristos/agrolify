#include "sensors.h"
#include <Arduino.h>

#define echoPin 5
#define trigPin 18


void setupWaterSensors() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

void getWaterLevel(int *waterLevel) {
  int t = 0, h = 0, hp = 0;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  t = pulseIn(echoPin, HIGH);
  h = t / 58;

  h = h - 1;  // offset correction
  h = 13 - h;  // water height, 0 - 50 cm

  hp = 9 * h;  // distance in %, 0-100 %
  if (hp < 0) {
    hp = 0;
  } else if (hp > 100) {
    hp = 100;
  }

  // Sending to computer
  Serial.print(hp);
  *waterLevel = hp;
}
