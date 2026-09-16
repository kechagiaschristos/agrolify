import {
    buildChartPanels,
    buildSummaryMetrics,
    convertTemperatureSeries,
    getLastMeasurementHelper,
    getMeasurementTrend,
    getTemperatureSuffix,
} from '../../../shared/components/workspace/utils';
import {getMeasurementAirTemperature, toFiniteNumber} from '../../../shared/utils/measurementSnapshot';

const REQUESTS = [{key: 'airTemperature', type: 'air-temperature'}, {key: 'airHumidity', type: 'air-humidity'}];
const THRESHOLDS = {condensationHigh: 75, condensationModerate: 65, vpdIdealMax: 1.3};
const SUMMARY_STYLES = {
    temperature: {key: 'temperature', progressColor: '#d96b4d'},
    humidity: {key: 'humidity', progressColor: '#4c9ffe'},
    vpd: {key: 'vpd', progressColor: '#8a5cf6'},
    condensationRisk: {
        key: 'condensationRisk',
        progressColor: '#32a060',
        highRiskColor: '#d14343',
        moderateRiskColor: '#d9892b',
    },
};

const getCondensationState = (humidity, t) => {
    if (humidity >= THRESHOLDS.condensationHigh) {
        return {risk: t('airPage.labels.risk.high'), trend: 1, trendLabel: t('airPage.summary.condensationRisk.highRiskLabel'), progress: 100, progressColor: SUMMARY_STYLES.condensationRisk.highRiskColor};
    }

    if (humidity >= THRESHOLDS.condensationModerate) {
        return {risk: t('airPage.labels.risk.moderate'), trend: 1, trendLabel: t('airPage.summary.condensationRisk.moderateRiskLabel'), progress: 68, progressColor: SUMMARY_STYLES.condensationRisk.moderateRiskColor};
    }

    return {risk: t('airPage.labels.risk.low'), trend: -1, trendLabel: t('airPage.summary.condensationRisk.lowRiskLabel'), progress: 32, progressColor: SUMMARY_STYLES.condensationRisk.progressColor};
};

const getAirMetrics = (snapshot, metricSeriesByKey) => {
    const unit = snapshot?.temperatureUnit || 'cel';
    const temperatureCel = snapshot?.air?.temperature?.cel;
    const humidity = snapshot?.air?.humidity;
    const saturationPressure = Number.isFinite(temperatureCel) && Number.isFinite(humidity) && humidity > 0
        ? 0.6108 * Math.exp((17.27 * temperatureCel) / (temperatureCel + 237.3))
        : null;

    return {
        unit,
        temperature: snapshot?.air?.temperature?.[unit],
        humidity,
        vpd: saturationPressure ? Math.max(0, saturationPressure * (1 - humidity / 100)) : null,
        temperatureSeries: convertTemperatureSeries(metricSeriesByKey.airTemperature || [], unit, 1),
        humiditySeries: metricSeriesByKey.airHumidity || [],
    };
};

const buildAirSummaryMetrics = (t, measuredAt, {unit, temperature, humidity, vpd}, temperatureTrend, humidityTrend, condensationState) => buildSummaryMetrics(getLastMeasurementHelper(t, measuredAt), [
    {
        style: SUMMARY_STYLES.temperature,
        label: t('navigation.airTemperature'),
        value: temperature ?? '--',
        suffix: Number.isFinite(temperature) ? getTemperatureSuffix(unit) : '',
        precision: 1,
        infoTooltip: t('airPage.summary.temperature.infoTooltip'),
        trend: temperatureTrend,
        trendLabel: t(temperatureTrend >= 0 ? 'airPage.summary.temperature.heatingBiasLabel' : 'airPage.summary.temperature.coolingBiasLabel'),
        progress: Number.isFinite(temperature) ? (temperature / 35) * 100 : 0,
    },
    {
        style: SUMMARY_STYLES.humidity,
        label: t('navigation.airHumidity'),
        value: humidity ?? '--',
        suffix: Number.isFinite(humidity) ? '%' : '',
        precision: 0,
        infoTooltip: t('airPage.summary.humidity.infoTooltip'),
        trend: humidityTrend,
        trendLabel: t(humidityTrend >= 0 ? 'airPage.summary.humidity.moistureRisingLabel' : 'airPage.summary.humidity.dryingDownLabel'),
        progress: Number.isFinite(humidity) ? humidity : 0,
    },
    {
        style: SUMMARY_STYLES.vpd,
        label: t('airPage.summary.vpd.label'),
        value: vpd?.toFixed(2) || '--',
        suffix: Number.isFinite(vpd) ? 'kPa' : '',
        precision: 2,
        infoTooltip: t('airPage.summary.vpd.infoTooltip'),
        trend: Number.isFinite(vpd) ? vpd - 1 : 0,
        trendLabel: t(Number.isFinite(vpd) && vpd > THRESHOLDS.vpdIdealMax ? 'airPage.summary.vpd.tooDryLabel' : 'airPage.summary.vpd.withinBandLabel'),
        progress: Number.isFinite(vpd) ? Math.min(vpd * 60, 100) : 0,
    },
    {
        style: SUMMARY_STYLES.condensationRisk,
        label: t('airPage.summary.condensationRisk.label'),
        value: condensationState.risk,
        suffix: '',
        precision: 0,
        infoTooltip: t('airPage.summary.condensationRisk.infoTooltip'),
        trend: condensationState.trend,
        trendLabel: condensationState.trendLabel,
        progress: condensationState.progress,
        progressColor: condensationState.progressColor,
    },
]);

export const createAirPageBuilder = (focusMetric = 'temperature') => ({snapshot, latestSnapshot, latestMeasurements, period, metricSeriesByKey, t}) => {
    const airMetrics = getAirMetrics(snapshot, metricSeriesByKey);
    const latestAirMetrics = getAirMetrics(latestSnapshot ?? snapshot, metricSeriesByKey);
    const chartPanels = buildChartPanels(period, [
        {key: 'airTemperature', title: t('navigation.airTemperature'), subtitle: t('airPage.charts.temperature.subtitle'), color: '#d96b4d', unit: getTemperatureSuffix(airMetrics.unit), series: airMetrics.temperatureSeries},
        {key: 'airHumidity', title: t('navigation.airHumidity'), subtitle: t('airPage.charts.humidity.subtitle'), color: '#4c9ffe', unit: '%', series: airMetrics.humiditySeries},
    ]);
    const condensationState = getCondensationState(latestAirMetrics.humidity, t);

    return {
        metricRequests: REQUESTS,
        summaryMetrics: buildAirSummaryMetrics(
            t,
            latestSnapshot?.createdAt ?? snapshot?.createdAt,
            latestAirMetrics,
            getMeasurementTrend(latestMeasurements, (measurement) => getMeasurementAirTemperature(measurement, latestAirMetrics.unit)),
            getMeasurementTrend(latestMeasurements, (measurement) => toFiniteNumber(measurement?.air_humidity)),
            condensationState,
        ),
        chartPanels: focusMetric === 'humidity' ? [chartPanels[1], chartPanels[0]] : chartPanels,
    };
};
