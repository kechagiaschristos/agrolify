#include "sensors.h"
#include <TinyGPS++.h>
#define RXD2 16
#define TXD2 17
HardwareSerial neogps(1);

TinyGPSPlus gps;

void setupGps() {
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2);
}

void getGps(float *latitude, float *longitude)
{
  while (neogps.available() > 0) {
    gps.encode(neogps.read());
    if (gps.location.isUpdated()) {
      *latitude = gps.location.lat();
      *longitude = gps.location.lng();
    }
  }
}
