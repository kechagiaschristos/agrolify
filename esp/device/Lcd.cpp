#include "sensors.h"
#include <Arduino.h>
#include <LiquidCrystal_I2C.h>
#define AIR_TEMPERATURE 0
#define AIR_HUMIDITY    1
#define SOIL_MOISTURE        2
#define SOIL_TEMPERATURE     3
#define WATER      4
//GPIO 21--> SDA
//GPIO 22--> SCL

int lcdColumns = 16;
int lcdRows = 2;
LiquidCrystal_I2C lcd(0x3F, lcdColumns, lcdRows);
long previousLCDMillis = 0;    // for LCD screen update
long lcdInterval = 2000;
int screen = 0;
int screenMax = 4;
bool screenChanged = true;



void setupLcd() {
  lcd.init();
  lcd.backlight();
}

void updateLcd(int temperatureCel, int temperatureFah, int airHumidity, int soilTemperatureCel, int soilTemperatureFah, int soilMoisture, int waterLevel) {
  unsigned long currentLCDMillis = millis();
  if (currentLCDMillis - previousLCDMillis > lcdInterval)
  {
    previousLCDMillis = currentLCDMillis;
    screen++;
    if (screen > screenMax) screen = 0;
    screenChanged = true;
  }

  if (screenChanged)
  {
    screenChanged = false;
    switch (screen)
    {
      case AIR_TEMPERATURE:
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Air Temp: ");
        lcd.setCursor(0, 1);
        lcd.print(temperatureCel);
        lcd.print("\xDF" "C / ");
        lcd.print(temperatureFah);
        lcd.print("\xDF" "F");
        break;
      case AIR_HUMIDITY:
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Air Humidity: ");
        lcd.setCursor(0, 1);
        lcd.print(airHumidity);
        lcd.print("%");
        break;
      case SOIL_TEMPERATURE:
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Soil Temp: ");
        lcd.setCursor(0, 1);
        lcd.print(soilTemperatureCel);
        lcd.print("\xDF" "C / ");
        lcd.print(soilTemperatureFah);
        lcd.print("\xDF" "F");
        break;
      case SOIL_MOISTURE:
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Soil Moisture:");
        lcd.setCursor(0, 1);
        lcd.print(soilMoisture);
        lcd.print("%");
        break;
      case WATER:
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Water Level: ");
        lcd.setCursor(0, 1);
        lcd.print(waterLevel);
        lcd.print("%");
        break;
      default:
        // cannot happen -> showError() ?
        break;
    }
  }

}














//
