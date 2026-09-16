#include "sensors.h"
#include "DHT.h"
#include <math.h>

#define DHTPIN 25
#define DHTTYPE DHT21
//#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
static int lastAirTemperatureCel = 0;
static int lastAirTemperatureFah = 32;
static int lastAirHumidity = 0;
static bool hasValidAirTemperature = false;
static bool hasValidAirHumidity = false;


void setupAirSensors() {
  dht.begin();
}
void getAirTemperature( int *airTemperatureCel, int *airTemperatureFah) {
  float temperatureCel = dht.readTemperature();
  float temperatureFah = dht.readTemperature(true);

  if (!isnan(temperatureCel) && !isnan(temperatureFah)) {
    lastAirTemperatureCel = (int) roundf(temperatureCel);
    lastAirTemperatureFah = (int) roundf(temperatureFah);
    hasValidAirTemperature = true;
  }

  if (hasValidAirTemperature) {
    *airTemperatureCel = lastAirTemperatureCel;
    *airTemperatureFah = lastAirTemperatureFah;
  } else {
    *airTemperatureCel = -127;
    *airTemperatureFah = -196;
  }

}

void getAirHumidity(int *airHumidity) {
  float humidity = dht.readHumidity();

  if (!isnan(humidity)) {
    lastAirHumidity = (int) roundf(humidity);
    hasValidAirHumidity = true;
  }

  if (hasValidAirHumidity) {
    *airHumidity = lastAirHumidity;
  } else {
    *airHumidity = -1;
  }
}
