export const toFiniteNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const round = (value, precision = 1) => {
    if (!Number.isFinite(value)) {
        return null;
    }

    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

const convertCelsiusToFahrenheit = (value) => (
    Number.isFinite(value) ? round((value * 9) / 5 + 32, 1) : null
);

const getDeviceCapacityLiters = (selectedDevice) => (
    toFiniteNumber(selectedDevice?.settings?.water_tank_capacity_liters)
);

const getWaterLevelLiters = (measurement) => toFiniteNumber(measurement?.water_level_liters);

export const getMeasurementTimestamp = (measurement) => (
    measurement?.created_at ?? null
);

export const getMeasurementAirTemperature = (measurement, unit = 'cel') => {
    const celsiusValue = toFiniteNumber(measurement?.air_temperature_c);

    if (unit === 'fah') {
        return convertCelsiusToFahrenheit(celsiusValue);
    }

    return celsiusValue;
};

export const getMeasurementSoilTemperature = (measurement, unit = 'cel') => {
    const celsiusValue = toFiniteNumber(measurement?.soil_temperature_c);

    if (unit === 'fah') {
        return convertCelsiusToFahrenheit(celsiusValue);
    }

    return celsiusValue;
};

export const getWaterMetrics = ({selectedDevice, latestMeasurement} = {}) => {
    const liters = getWaterLevelLiters(latestMeasurement);
    const capacityLiters = getDeviceCapacityLiters(selectedDevice);
    const level = Number.isFinite(liters) && Number.isFinite(capacityLiters) && capacityLiters > 0
        ? Math.max(0, Math.min(100, round((liters / capacityLiters) * 100, 0)))
        : null;

    return {
        level,
        liters,
        gallons: Number.isFinite(liters) ? round(liters * 0.264172, 1) : null,
        capacityLiters,
    };
};
