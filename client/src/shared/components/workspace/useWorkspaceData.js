import {useEffect, useState} from 'react';
import dayjs from 'dayjs';
import {useDispatch, useSelector} from 'react-redux';
import {selectSelectedDeviceDetails} from '../../../features/devices/store/devicesSelectors.js';
import {
    getMeasurementAirTemperature,
    getMeasurementSoilTemperature,
    getMeasurementTimestamp,
    getWaterMetrics,
    toFiniteNumber,
} from '../../utils/measurementSnapshot';
import {
    selectLatestMeasurement,
    selectLatestMeasurements,
    selectMeasurementsState,
} from '../../../features/measurements/store/measurementsSelectors';
import {fetchAirMeasurements, fetchSoilMeasurements, fetchWaterMeasurements} from '../../../features/measurements/store/measurementsSlice.js';

const METRIC_TYPE_TO_FIELD = {
    'air-temperature': 'air_temperature_c',
    'air-humidity': 'air_humidity',
    'soil-temperature': 'soil_temperature_c',
    'soil-moisture': 'soil_moisture',
    'water-liters': 'water_level_liters',
};

const MEASUREMENT_RESOURCES = {
    air: {
        bucket: 'airMeasurements',
        loadingKey: 'fetchAirMeasurementsLoading',
        fetchMeasurements: fetchAirMeasurements,
    },
    soil: {
        bucket: 'soilMeasurements',
        loadingKey: 'fetchSoilMeasurementsLoading',
        fetchMeasurements: fetchSoilMeasurements,
    },
    water: {
        bucket: 'waterMeasurements',
        loadingKey: 'fetchWaterMeasurementsLoading',
        fetchMeasurements: fetchWaterMeasurements,
    },
};

const normalizeWeekSeries = (series, selectedDate) => {
    const start = dayjs(selectedDate).startOf('day').subtract((dayjs(selectedDate).day() + 6) % 7, 'day');
    const grouped = new Map();

    series.forEach(({x, y}) => {
        if (!x || !Number.isFinite(y)) {
            return;
        }

        const key = dayjs(x).format('YYYY-MM-DD');
        const [sum, count] = grouped.get(key) || [0, 0];
        grouped.set(key, [sum + Number(y), count + 1]);
    });

    return Array.from({length: 7}, (_, index) => {
        const day = start.add(index, 'day');
        const [sum, count] = grouped.get(day.format('YYYY-MM-DD')) || [];
        return {x: day.toISOString(), y: count ? sum / count : null};
    });
};

const buildSeriesSnapshot = (metricSeriesByKey) => {
    const airTemperature = metricSeriesByKey.airTemperature?.at(-1);
    const airHumidity = metricSeriesByKey.airHumidity?.at(-1);
    const soilTemperature = metricSeriesByKey.soilTemperature?.at(-1);
    const soilMoisture = metricSeriesByKey.soilMoisture?.at(-1);
    const waterLevel = metricSeriesByKey.waterLevel?.at(-1);

    return {
        created_at: waterLevel?.x ?? soilMoisture?.x ?? soilTemperature?.x ?? airHumidity?.x ?? airTemperature?.x ?? null,
        air_temperature_c: airTemperature?.y ?? null,
        air_humidity: airHumidity?.y ?? null,
        soil_temperature_c: soilTemperature?.y ?? null,
        soil_moisture: soilMoisture?.y ?? null,
        water_level_liters: waterLevel?.y ?? null,
    };
};

const buildDeviceSnapshot = (selectedDevice, latestMeasurement) => {
    if (!selectedDevice?.id) {
        return null;
    }

    const water = getWaterMetrics({selectedDevice, latestMeasurement});
    return {
        deviceId: selectedDevice.id,
        createdAt: getMeasurementTimestamp(latestMeasurement),
        air: {
            temperature: {
                cel: getMeasurementAirTemperature(latestMeasurement, 'cel'),
                fah: getMeasurementAirTemperature(latestMeasurement, 'fah'),
            },
            humidity: toFiniteNumber(latestMeasurement?.air_humidity),
        },
        soil: {
            temperature: {
                cel: getMeasurementSoilTemperature(latestMeasurement, 'cel'),
                fah: getMeasurementSoilTemperature(latestMeasurement, 'fah'),
            },
            moisture: toFiniteNumber(latestMeasurement?.soil_moisture),
        },
        water: {level: water.level, liters: water.liters, capacityLiters: water.capacityLiters},
        temperatureUnit: selectedDevice?.settings?.temperature_unit || 'cel',
        wateringSchedules: selectedDevice?.wateringSchedules || [],
    };
};

export default function useWorkspaceData({buildWorkspacePage, t}) {
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDeviceDetails);
    const measurementsState = useSelector(selectMeasurementsState);
    const latestMeasurements = useSelector(selectLatestMeasurements);
    const latestMeasurement = useSelector(selectLatestMeasurement);
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [selectedDate, setSelectedDate] = useState(() => new Date());

    const deviceId = selectedDevice?.id ?? null;
    const {metricRequests = []} = buildWorkspacePage({
        snapshot: null,
        period: selectedPeriod,
        selectedDate,
        metricSeriesByKey: {},
        selectedDevice,
        t,
    });
    const measurementType = metricRequests[0]?.type?.split('-')?.[0];
    const resource = MEASUREMENT_RESOURCES[measurementType];
    const isLoadingSeries = resource ? Boolean(measurementsState[resource.loadingKey]) : false;

    const dateKey = dayjs(selectedDate).format('YYYY-MM-DD');
    const measurements = resource ? measurementsState[resource.bucket] || [] : [];
    const metricSeriesByKey = Object.fromEntries(metricRequests.map(({key, type}) => {
        const field = METRIC_TYPE_TO_FIELD[type];
        const series = measurements
            .map((item) => ({x: getMeasurementTimestamp(item), y: toFiniteNumber(item?.[field])}))
            .filter(({x, y}) => x && Number.isFinite(y));

        if (selectedPeriod === 'week') {
            return [key, normalizeWeekSeries(series, selectedDate)];
        }

        return [key, series];
    }));

    const snapshot = buildDeviceSnapshot(selectedDevice, buildSeriesSnapshot(metricSeriesByKey));
    const latestSnapshot = buildDeviceSnapshot(selectedDevice, latestMeasurement);
    const pageData = buildWorkspacePage({
        snapshot,
        latestSnapshot,
        latestMeasurements,
        period: selectedPeriod,
        selectedDate,
        metricSeriesByKey,
        selectedDevice,
        t,
    });

    useEffect(() => {
        if (!deviceId || !resource) {
            return;
        }

        dispatch(resource.fetchMeasurements({
            deviceId,
            type: measurementType,
            period: selectedPeriod,
            date: dateKey,
        }));
    }, [deviceId, dispatch, resource, measurementType, dateKey, selectedPeriod]);

    return {snapshot, pageData, selectedPeriod, selectedDate, setSelectedPeriod, setSelectedDate, isLoadingSeries};
}
