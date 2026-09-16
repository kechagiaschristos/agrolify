#include "sensors.h"
#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

#define soilTemperaturePin 19
#define soilMoisturePin 32

OneWire oneWire(soilTemperaturePin);
DallasTemperature soilSensor(&oneWire);
static int lastSoilTemperatureCel = 0;
static int lastSoilTemperatureFah = 32;
static bool hasValidSoilTemperature = false;


const int airValue = 3620;
const int waterValue = 1680;

void setupSoilSensors() {
  soilSensor.begin();
  soilSensor.setWaitForConversion(true);
  Serial.print("Soil temperature sensors found: ");
  Serial.println(soilSensor.getDeviceCount());
}


void getSoilTemperature( int *soilTemperatureCel, int *soilTemperatureFah) {
  soilSensor.requestTemperatures();
  float temperatureCel = soilSensor.getTempCByIndex(0);

  Serial.print("Raw soil temperature (C): ");
  Serial.println(temperatureCel);

  if (temperatureCel != DEVICE_DISCONNECTED_C && !isnan(temperatureCel)) {
    lastSoilTemperatureCel = (int) roundf(temperatureCel);
    lastSoilTemperatureFah = (int) roundf(soilSensor.toFahrenheit(temperatureCel));
    hasValidSoilTemperature = true;
  } else {
    Serial.println("Soil temperature sensor is not returning a valid reading");
  }

  if (hasValidSoilTemperature) {
    *soilTemperatureCel = lastSoilTemperatureCel;
    *soilTemperatureFah = lastSoilTemperatureFah;
  } else {
    *soilTemperatureCel = -127;
    *soilTemperatureFah = -196;
  }
}


void getSoilMoisture(int *soilMoisture ) {
  *soilMoisture = map(analogRead(soilMoisturePin), airValue, waterValue, 0, 100);

  if (*soilMoisture > 100) {
    *soilMoisture = 100;
  }
  else if (*soilMoisture < 0) {
    *soilMoisture = 0;
  }
}
