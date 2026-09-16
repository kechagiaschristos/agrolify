import {useMemo} from 'react';
import dayjs from 'dayjs';
import {Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import DeviceMapCanvas from '../components/DeviceMapCanvas.jsx';
import {selectDevice} from '../../devices/store/devicesSlice.js';
import {
    getDeviceCode,
    selectDevicesList,
    selectFetchDevicesLoading,
    selectSelectedDevice,
} from '../../devices/store/devicesSelectors';
import {selectLatestMeasurements} from '../../measurements/store/measurementsSelectors';
import {getMeasurementAirTemperature, getMeasurementSoilTemperature, getMeasurementTimestamp, getWaterMetrics, toFiniteNumber} from '../../../shared/utils/measurementSnapshot';

const STATUS_COLORS = {
    healthy: {color: 'success', hex: '#2f8f5b'},
    warning: {color: 'warning', hex: '#d48806'},
    offline: {color: 'default', hex: '#8c8c8c'},
    critical: {color: 'error', hex: '#cf1322'},
};
const ONLINE_THRESHOLD_MINUTES = 120;
const OFFLINE_THRESHOLD_MINUTES = 24 * 60;
const toNumber = toFiniteNumber;
const getDeviceId = (device, index = 0) => device?.id || `device-${index}`;
const getLatestMeasurement = (device, measurements = []) => (
    measurements.find((measurement) => String(measurement?.device_id ?? null) === String(device?.id ?? null)) || null
);

const getStatusKey = (waterLevel, lastSeenAt) => {
    const minutesSinceUpdate = lastSeenAt ? dayjs().diff(dayjs(lastSeenAt), 'minute') : null;

    if (minutesSinceUpdate === null || minutesSinceUpdate >= OFFLINE_THRESHOLD_MINUTES) {
        return 'offline';
    }

    if (Number.isFinite(waterLevel) && waterLevel <= 15) {
        return 'critical';
    }

    if (minutesSinceUpdate >= ONLINE_THRESHOLD_MINUTES || (Number.isFinite(waterLevel) && waterLevel <= 35)) {
        return 'warning';
    }

    return 'healthy';
};

const normalizeMapDevices = (devices = [], latestMeasurements = [], t) => devices.map((device, index) => {
    const measurementData = getLatestMeasurement(device, latestMeasurements);
    const latitude = toNumber(measurementData?.gps_latitude);
    const longitude = toNumber(measurementData?.gps_longitude);
    const position = Number.isFinite(latitude) && Math.abs(latitude) <= 90
        && Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? {lat: latitude, lng: longitude} : null;
    const unit = device?.settings?.temperature_unit === 'fah' ? 'fah' : 'cel';
    const waterMetrics = getWaterMetrics({selectedDevice: device, latestMeasurement: measurementData});
    const lastSeenAt = getMeasurementTimestamp(measurementData);
    const statusKey = getStatusKey(waterMetrics.level, lastSeenAt);

    return {
        id: getDeviceId(device, index),
        name: device?.name || t('mapPage.deviceFallbackName', {index: index + 1}),
        type: device?.state ? t('mapPage.deviceTypes.controller') : t('mapPage.deviceTypes.sensorHub'),
        position,
        hasCoordinates: Boolean(position),
        locationLabel: position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : t('mapPage.locationUnavailable'),
        statusKey,
        status: {...STATUS_COLORS[statusKey], label: t(`mapPage.statusLabels.${statusKey}`)},
        metrics: {
            unit,
            airTemperature: getMeasurementAirTemperature(measurementData, unit),
            airHumidity: toNumber(measurementData?.air_humidity),
            soilTemperature: getMeasurementSoilTemperature(measurementData, unit),
            soilMoisture: toNumber(measurementData?.soil_moisture),
            waterLevel: waterMetrics.level,
        },
        lastSeenLabel: lastSeenAt ? dayjs(lastSeenAt).format('DD MMM YYYY, HH:mm') : t('common.noRecentUpdate'),
    };
});

function Maps() {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const baseDevices = useSelector(selectDevicesList);
    const loading = useSelector(selectFetchDevicesLoading);
    const selectedDeviceEntry = useSelector(selectSelectedDevice);
    const latestMeasurements = useSelector(selectLatestMeasurements);
    const devices = useMemo(() => (
        baseDevices.map((device) => ({
            ...device,
            settings: String(selectedDeviceEntry?.id ?? null) === String(device.id) ? selectedDeviceEntry : device,
        }))
    ), [baseDevices, selectedDeviceEntry]);
    const mapDevices = useMemo(() => normalizeMapDevices(devices, latestMeasurements, t), [devices, latestMeasurements, t]);

    const handleSelectDevice = (deviceId) => {
        const nextDevice = devices.find((device) => String(device?.id) === String(deviceId));
        const nextDeviceCode = getDeviceCode(nextDevice);

        if (nextDeviceCode) {
            dispatch(selectDevice(nextDeviceCode)).catch(() => null);
        }
    };

    if (loading && !devices.length) {
        return <Typography.Title level={4}>{t('mapPage.loadingWorkspace')}</Typography.Title>;
    }

    return (
        <DeviceMapCanvas
            devices={mapDevices}
            selectedDeviceId={selectedDeviceEntry?.id ?? null}
            onSelectDevice={handleSelectDevice}
        />
    );
}

export default Maps;
