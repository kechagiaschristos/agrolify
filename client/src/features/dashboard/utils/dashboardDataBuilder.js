import dayjs from 'dayjs';
import routePaths from '../../../app/router/routePaths.json';
import {
    getMeasurementAirTemperature,
    getMeasurementSoilTemperature,
    getMeasurementTimestamp,
    toFiniteNumber,
} from '../../../shared/utils/measurementSnapshot';

const round = (value, precision = 1) => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

const METRICS = [
    {
        key: 'airTemperature',
        titleKey: 'navigation.airTemperature',
        categoryKey: 'dashboardData.categories.climate',
        route: routePaths.air,
        precision: 1,
        getValue: (measurement, unit) => getMeasurementAirTemperature(measurement, unit),
        getSeriesValue: (measurement) => toFiniteNumber(measurement?.air_temperature_c),
    },
    {
        key: 'airHumidity',
        titleKey: 'navigation.airHumidity',
        categoryKey: 'dashboardData.categories.climate',
        route: routePaths.air,
        precision: 0,
        suffix: '%',
        getValue: (measurement) => toFiniteNumber(measurement?.air_humidity),
        getSeriesValue: (measurement) => toFiniteNumber(measurement?.air_humidity),
    },
    {
        key: 'soilTemperature',
        titleKey: 'navigation.soilTemperature',
        categoryKey: 'dashboardData.categories.rootZone',
        route: routePaths.soil,
        precision: 1,
        getValue: (measurement, unit) => getMeasurementSoilTemperature(measurement, unit),
        getSeriesValue: (measurement) => toFiniteNumber(measurement?.soil_temperature_c),
    },
    {
        key: 'soilMoisture',
        titleKey: 'navigation.soilMoisture',
        categoryKey: 'dashboardData.categories.rootZone',
        route: routePaths.soil,
        precision: 0,
        suffix: '%',
        getValue: (measurement) => toFiniteNumber(measurement?.soil_moisture),
        getSeriesValue: (measurement) => toFiniteNumber(measurement?.soil_moisture),
    },
];

const buildMetricThresholds = (selectedDevice) => {
    const minAirTemperature = selectedDevice?.settings?.temperature_air_min_c ?? 18;
    const maxAirTemperature = selectedDevice?.settings?.temperature_air_max_c ?? 28;

    return {
        airTemperature: {min: minAirTemperature, max: maxAirTemperature},
        airHumidity: {min: 50, max: 70},
        soilTemperature: {min: 18, max: 24},
        soilMoisture: {min: 45, max: 65},
    };
};

const formatMeasurementTimestamp = (timestamp, fallback) => {
    const parsed = dayjs(timestamp);
    return parsed.isValid() ? parsed.format('DD MMM, HH:mm') : fallback;
};

const getTrendState = (latestValue, previousValue) => {
    if (!Number.isFinite(latestValue) || !Number.isFinite(previousValue)) {
        return 'stable';
    }

    if (latestValue > previousValue) return 'rising';
    if (latestValue < previousValue) return 'falling';
    return 'stable';
};

const buildMetricHistory = (series, currentValue, currentTimestamp, precision) => {
    const points = series
        .filter((point) => point?.timestamp && Number.isFinite(point?.value))
        .map((point) => ({
            timestamp: point.timestamp,
            value: round(point.value, precision),
        }));

    if (Number.isFinite(currentValue)) {
        const currentPoint = {
            timestamp: currentTimestamp || points.at(-1)?.timestamp || new Date().toISOString(),
            value: round(currentValue, precision),
        };

        if (points.length) {
            points.splice(-1, 1, currentPoint);
        } else {
            points.push(currentPoint);
        }
    }

    return {
        points,
        latestValue: points.at(-1)?.value ?? null,
        previousValue: points.at(-2)?.value ?? null,
    };
};

const getSeries = (measurements, getSeriesValue) => (
    measurements
        .map((measurement) => ({
            timestamp: measurement?.created_at,
            value: getSeriesValue(measurement),
        }))
        .filter((point) => point.timestamp && Number.isFinite(point.value))
);

export const buildDashboardData = ({selectedDevice, latestMeasurement, latestMeasurements = [], t}) => {
    const temperatureUnit = selectedDevice?.settings?.temperature_unit || 'cel';
    const temperatureSuffix = temperatureUnit === 'fah' ? '\u00B0F' : '\u00B0C';
    const unavailableLabel = t('dashboardData.defaults.measurementUnavailableLabel');
    const noSignalLabel = t('dashboardData.defaults.noSignalLabel');
    const measurementTimestamp = getMeasurementTimestamp(latestMeasurement);
    const thresholds = buildMetricThresholds(selectedDevice);
    const orderedMeasurements = [...latestMeasurements]
        .filter((measurement) => measurement?.created_at)
        .sort((left, right) => dayjs(left.created_at).valueOf() - dayjs(right.created_at).valueOf());

    return {
        metricCards: METRICS.map((metric) => {
            const currentValue = metric.getValue(latestMeasurement, temperatureUnit);
            const value = Number.isFinite(currentValue) ? currentValue : null;
            const suffix = metric.suffix ?? temperatureSuffix;
            const range = thresholds[metric.key];
            const history = buildMetricHistory(
                getSeries(orderedMeasurements, metric.getSeriesValue),
                value,
                measurementTimestamp,
                metric.precision,
            );
            const trendState = getTrendState(history.latestValue, history.previousValue);

            return {
                key: metric.key,
                title: t(metric.titleKey),
                category: t(metric.categoryKey),
                route: metric.route,
                value,
                suffix,
                rangeLabel: `${range.min}${suffix} - ${range.max}${suffix}`,
                trendState,
                trendLabel: t(`dashboardData.trend.${trendState}`),
                points: history.points,
                lastMeasurementLabel: formatMeasurementTimestamp(measurementTimestamp, noSignalLabel),
                chartAriaLabel: t('dashboardMetricCard.chartAria', {
                    metric: t(metric.titleKey),
                    value: Number.isFinite(value)
                        ? `${value}${suffix ? ` ${suffix}` : ''}`
                        : unavailableLabel,
                }),
            };
        }),
    };
};
