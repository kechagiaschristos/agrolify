import React from 'react';
import {buildChartPanels, buildSummaryMetrics, formatLiquidValue, getLastMeasurementHelper, getLiquidUnit, getLiquidUnitSuffix, getMeasurementTrend, litersToPercent} from '../../../shared/components/workspace/utils';
import {toFiniteNumber} from '../../../shared/utils/measurementSnapshot';
import WaterScheduleSummary from '../components/WaterScheduleSummary';

const REQUESTS = [{key: 'waterLevel', type: 'water-liters'}];
const SUMMARY_STYLES = {
    tankLevel: {key: 'tank-level', progressColor: '#35a6b8'},
    autonomy: {key: 'autonomy', progressColor: '#4c7cf1'},
    draw: {key: 'draw', progressColor: '#d9892b'},
};
const PERIOD_DAYS = {day: 1, week: 7, month: 30, year: 365};

const syncSeriesToLatestValue = (series, latestValue) => !Array.isArray(series) || !series.length || !Number.isFinite(latestValue)
    ? series
    : series.map((item, index) => index === series.length - 1 ? {...item, y: latestValue} : item);

const getDailyDraw = (series, period) => {
    const startValue = Number(series?.[0]?.y);
    const endValue = Number(series?.at(-1)?.y);
    return Number.isFinite(startValue) && Number.isFinite(endValue)
        ? Math.max(1, Math.round(Math.max(0, startValue - endValue) / (PERIOD_DAYS[period] || 1)))
        : '--';
};

const getAutonomyDays = (currentWaterLiters, dailyDraw) => (
    Number.isFinite(currentWaterLiters) && typeof dailyDraw === 'number' && dailyDraw > 0
        ? Math.max(1, Math.round(currentWaterLiters / dailyDraw))
        : '--'
);

const formatReservoirValue = (value, capacity, unit) => {
    const percent = litersToPercent(Number(value), capacity);
    return Number.isFinite(percent) ? `${Math.round(percent)}% / ${formatLiquidValue(Number(value), unit)}` : formatLiquidValue(Number(value), unit);
};

export const createWaterPageBuilder = ({openScheduleDrawer}) => ({snapshot, latestSnapshot, latestMeasurements, period, metricSeriesByKey, selectedDevice, t}) => {
    const currentWaterLiters = latestSnapshot?.water?.liters ?? snapshot?.water?.liters;
    const tankCapacityLiters = latestSnapshot?.water?.capacityLiters ?? snapshot?.water?.capacityLiters ?? selectedDevice?.settings?.water_tank_capacity_liters;
    const waterLevel = latestSnapshot?.water?.level ?? litersToPercent(currentWaterLiters, tankCapacityLiters);
    const liquidUnit = getLiquidUnit(selectedDevice);
    const reservoirSeries = syncSeriesToLatestValue(metricSeriesByKey.waterLevel || [], snapshot?.water?.liters);
    const recentWaterTrend = getMeasurementTrend(latestMeasurements, (measurement) => toFiniteNumber(measurement?.water_level_liters));
    const drawValue = Math.max(0, Math.round(Math.abs(Math.min(recentWaterTrend, 0)))) || getDailyDraw(reservoirSeries, period);
    const autonomyDays = getAutonomyDays(currentWaterLiters, drawValue);
    const measuredAt = latestSnapshot?.createdAt ?? snapshot?.createdAt;

    return {
        metricRequests: REQUESTS,
        summaryMetrics: [
            ...buildSummaryMetrics(getLastMeasurementHelper(t, measuredAt), [
                {
                    style: SUMMARY_STYLES.tankLevel,
                    mobileFullWidth: true,
                    label: t('waterPage.summary.tankLevel.label'),
                    value: Number.isFinite(waterLevel)
                        ? Number.isFinite(currentWaterLiters) ? formatReservoirValue(currentWaterLiters, tankCapacityLiters, liquidUnit) : `${Math.round(waterLevel)}%`
                        : '--',
                    suffix: '',
                    precision: 0,
                    infoTooltip: t('waterPage.summary.tankLevel.infoTooltip'),
                    trend: recentWaterTrend,
                    trendLabel: t(recentWaterTrend >= 0 ? 'waterPage.summary.tankLevel.refillingLabel' : 'waterPage.summary.tankLevel.consumingLabel'),
                    progress: Number.isFinite(waterLevel) ? waterLevel : 0,
                },
                {
                    style: SUMMARY_STYLES.autonomy,
                    label: t('waterPage.summary.autonomy.label'),
                    value: autonomyDays,
                    suffix: typeof autonomyDays === 'number' ? t('common.dayUnit', {count: autonomyDays}) : '',
                    precision: 0,
                    infoTooltip: t('waterPage.summary.autonomy.infoTooltip'),
                    trend: typeof autonomyDays === 'number' ? autonomyDays - 4 : 0,
                    trendLabel: t(typeof autonomyDays === 'number' && autonomyDays >= 4 ? 'waterPage.summary.autonomy.comfortableLabel' : 'waterPage.summary.autonomy.shortRunwayLabel'),
                    progress: typeof autonomyDays === 'number' ? Math.min(autonomyDays * 20, 100) : 0,
                },
                {
                    style: SUMMARY_STYLES.draw,
                    label: t('waterPage.summary.draw.label'),
                    value: drawValue,
                    suffix: typeof drawValue === 'number' ? getLiquidUnitSuffix(liquidUnit) : '',
                    precision: 0,
                    infoTooltip: t('waterPage.summary.draw.infoTooltip'),
                    trend: typeof drawValue === 'number' ? 18 - drawValue : 0,
                    trendLabel: t(typeof drawValue === 'number' && drawValue <= 18 ? 'waterPage.summary.draw.moderateLabel' : 'waterPage.summary.draw.heavyLabel'),
                    progress: typeof drawValue === 'number' ? Math.min(drawValue * 4, 100) : 0,
                },
            ]),
            {
                key: 'water-schedule-hub',
                type: 'custom',
                title: t('waterPage.schedulePanel.title'),
                subtitle: t('waterPage.schedulePanel.subtitle'),
                render: () => React.createElement(WaterScheduleSummary, {events: latestSnapshot?.wateringSchedules || snapshot?.wateringSchedules || [], onOpenPlanner: openScheduleDrawer}),
            },
        ],
        chartPanels: buildChartPanels(period, [
            {
                key: 'waterLevel',
                title: t('waterPage.chart.title'),
                subtitle: t('waterPage.chart.subtitle'),
                color: '#35a6b8',
                unit: 'L',
                yAxisWidth: 88,
                xAxisHeight: 44,
                xAxisPadding: {left: 12, right: 0},
                axisValueFormatter: (value) => formatReservoirValue(value, tankCapacityLiters, liquidUnit),
                tooltipValueFormatter: (value) => formatReservoirValue(value, tankCapacityLiters, liquidUnit),
                series: reservoirSeries,
            },
        ], {yearTooltipFormat: 'DD MMM YYYY'}),
    };
};
