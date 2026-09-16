export const normalizeMeasurement = (measurement) => {
    if (!measurement) {
        return measurement;
    }

    return {
        ...measurement,
        created_at: measurement.created_at ?? null,
        device_id: measurement.device_id ?? null,
        air_temperature_c: measurement.air_temperature_c ?? measurement.avg_temperature_c ?? null,
        air_humidity: measurement.air_humidity ?? measurement.avg_humidity ?? null,
        soil_temperature_c: measurement.soil_temperature_c ?? measurement.avg_soil_temperature_c ?? null,
        soil_moisture: measurement.soil_moisture ?? measurement.avg_moisture ?? null,
        water_level_liters: measurement.water_level_liters ?? measurement.avg_water_level_liters ?? null,
        gps_latitude: measurement.gps_latitude ?? null,
        gps_longitude: measurement.gps_longitude ?? null,
    };
};

export const normalizeMeasurements = (measurements) => (
    Array.isArray(measurements) ? measurements.map(normalizeMeasurement) : []
);
