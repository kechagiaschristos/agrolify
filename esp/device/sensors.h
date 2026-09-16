#ifndef sensors
#define sensors
#include <ArduinoJson.h>

//Air
void setupAirSensors();
void getAirTemperature( int *airTemperatureCel, int *airTemperatureFah);
void getAirHumidity(int *airHumidity);

//Soil
void setupSoilSensors();
void getSoilTemperature( int *soilTemperatureCel, int *soilTemperatureFah);
void getSoilMoisture(int *soilMoisture);

//Water
void setupWaterSensors();
void getWaterLevel(int *waterLevel);

//Relay
void setupRelay();
void disableRelayOutputs();
boolean waterPump(const JsonObjectConst &waterPump);
boolean fan(const JsonObjectConst &fans);

//Gps
void setupGps();
void getGps(float *latitude, float *longitude);

//Lcd
void setupLcd();
void updateLcd(int airTemperatureCel, int airTemperatureFah, int airHumidity, int soilTemperatureCel, int soilTemperatureFah, int soilMoisture, int waterLevel);

//windows
void setupWindows();
void stopWindows();
bool enforceActuatorSafety();
boolean windows(const JsonObject &windows);

#endif
