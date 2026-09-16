import {buildChartPanels, buildSummaryMetrics, convertTemperatureSeries, getLastMeasurementHelper, getMeasurementTrend, getTemperatureSuffix} from '../../../shared/components/workspace/utils';
import {getMeasurementSoilTemperature, toFiniteNumber} from '../../../shared/utils/measurementSnapshot';

const REQUESTS = [{key: 'soilTemperature', type: 'soil-temperature'}, {key: 'soilMoisture', type: 'soil-moisture'}];
const THRESHOLDS = {rootZoneTemperatureC: 21, rootZoneMoisture: 50, balancedZoneScore: 78, efficientIrrigation: 75};
const SUMMARY_STYLES = {
    moisture: {key: 'soil-moisture', progressColor: '#2f97d1'},
    temperature: {key: 'soil-temperature', progressColor: '#60a561'},
    rootScore: {key: 'root-score', progressColor: '#c79a2b'},
    efficiency: {key: 'efficiency', progressColor: '#7d67e8'},
};

const getRootZoneScore = (temperature, moisture) => {
    if (!Number.isFinite(temperature) || !Number.isFinite(moisture)) {
        return 0;
    }

    const temperaturePenalty = Math.min(Math.abs(THRESHOLDS.rootZoneTemperatureC - temperature) * 9, 40);
    const moisturePenalty = Math.min(Math.abs(THRESHOLDS.rootZoneMoisture - moisture) * 1.1, 40);
    return Math.max(0, Math.round(100 - temperaturePenalty - moisturePenalty));
};

const getSoilMetrics = (snapshot, metricSeriesByKey) => {
    const unit = snapshot?.temperatureUnit || 'cel';
    const soilMoisture = snapshot?.soil?.moisture;
    return {
        unit,
        soilTemperature: snapshot?.soil?.temperature?.[unit],
        soilMoisture,
        temperatureSeries: convertTemperatureSeries(metricSeriesByKey.soilTemperature || [], unit, 1),
        moistureSeries: metricSeriesByKey.soilMoisture || [],
        zoneScore: getRootZoneScore(snapshot?.soil?.temperature?.cel, soilMoisture),
        irrigationEfficiency: Number.isFinite(soilMoisture) ? Math.max(0, Math.min(100, Math.round(soilMoisture + 18))) : 0,
    };
};

const buildSoilSummaryMetrics = (t, measuredAt, {unit, soilTemperature, soilMoisture, zoneScore, irrigationEfficiency}, temperatureTrend, moistureTrend) => buildSummaryMetrics(
    getLastMeasurementHelper(t, measuredAt),
    [
        {
            style: SUMMARY_STYLES.temperature,
            label: t('navigation.soilTemperature'),
            value: soilTemperature ?? '--',
            suffix: Number.isFinite(soilTemperature) ? getTemperatureSuffix(unit) : '',
            precision: 1,
            infoTooltip: t('soilPage.summary.temperature.infoTooltip'),
            trend: temperatureTrend,
            trendLabel: t(temperatureTrend >= 0 ? 'soilPage.summary.temperature.warmingLabel' : 'soilPage.summary.temperature.coolingLabel'),
            progress: Number.isFinite(soilTemperature) ? (soilTemperature / 30) * 100 : 0,
        },
        {
            style: SUMMARY_STYLES.moisture,
            label: t('navigation.soilMoisture'),
            value: soilMoisture ?? '--',
            suffix: Number.isFinite(soilMoisture) ? '%' : '',
            precision: 0,
            infoTooltip: t('soilPage.summary.moisture.infoTooltip'),
            trend: moistureTrend,
            trendLabel: t(moistureTrend >= 0 ? 'soilPage.summary.moisture.rechargingLabel' : 'soilPage.summary.moisture.dryingLabel'),
            progress: Number.isFinite(soilMoisture) ? soilMoisture : 0,
        },
        {
            style: SUMMARY_STYLES.rootScore,
            label: t('soilPage.summary.rootScore.label'),
            value: zoneScore,
            suffix: '/100',
            precision: 0,
            infoTooltip: t('soilPage.summary.rootScore.infoTooltip'),
            trend: zoneScore - THRESHOLDS.balancedZoneScore,
            trendLabel: t(zoneScore >= THRESHOLDS.balancedZoneScore ? 'soilPage.summary.rootScore.balancedLabel' : 'soilPage.summary.rootScore.needsTuningLabel'),
            progress: zoneScore,
        },
        {
            style: SUMMARY_STYLES.efficiency,
            label: t('soilPage.summary.efficiency.label'),
            value: irrigationEfficiency,
            suffix: '%',
            precision: 0,
            infoTooltip: t('soilPage.summary.efficiency.infoTooltip'),
            trend: irrigationEfficiency - THRESHOLDS.efficientIrrigation,
            trendLabel: t(irrigationEfficiency >= THRESHOLDS.efficientIrrigation ? 'soilPage.summary.efficiency.efficientLabel' : 'soilPage.summary.efficiency.unevenLabel'),
            progress: irrigationEfficiency,
        },
    ],
);

const buildSoilChartPanels = (t, period, unit, temperatureSeries, moistureSeries) => buildChartPanels(period, [
    {key: 'soilTemperature', title: t('navigation.soilTemperature'), subtitle: t('soilPage.charts.temperature.subtitle'), color: '#60a561', unit: getTemperatureSuffix(unit), series: temperatureSeries},
    {key: 'soilMoisture', title: t('navigation.soilMoisture'), subtitle: t('soilPage.charts.moisture.subtitle'), color: '#2f97d1', unit: '%', series: moistureSeries},
]);

export const buildSoilPage = ({snapshot, latestSnapshot, latestMeasurements, period, metricSeriesByKey, t}) => {
    const soilMetrics = getSoilMetrics(snapshot, metricSeriesByKey);
    const latestSoilMetrics = getSoilMetrics(latestSnapshot ?? snapshot, metricSeriesByKey);

    return {
        metricRequests: REQUESTS,
        summaryMetrics: buildSoilSummaryMetrics(
            t,
            (latestSnapshot ?? snapshot)?.createdAt ?? null,
            latestSoilMetrics,
            getMeasurementTrend(latestMeasurements, (measurement) => getMeasurementSoilTemperature(measurement, latestSoilMetrics.unit)),
            getMeasurementTrend(latestMeasurements, (measurement) => toFiniteNumber(measurement?.soil_moisture)),
        ),
        chartPanels: buildSoilChartPanels(t, period, soilMetrics.unit, soilMetrics.temperatureSeries, soilMetrics.moistureSeries),
    };
};
