import dayjs from 'dayjs';

const GALLONS_PER_LITER = 0.264172;
const round = (value, precision = 1) => Math.round(value * 10 ** precision) / 10 ** precision;

const PERIOD_AXIS_PROPS = {
    day:   {axisFormat: 'HH:mm',  tooltipFormat: 'DD MMM, HH:mm',    xAxisInterval: 'preserveStartEnd', xAxisMinTickGap: 10},
    week:  {axisFormat: 'dddd',   tooltipFormat: 'DD MMM YYYY',       xAxisInterval: 0, xAxisAngle: -24, xAxisHeight: 56, xAxisTextAnchor: 'end', xAxisPadding: {left: 12, right: 0}},
    month: {axisFormat: 'D ddd',  tooltipFormat: 'dddd, DD MMM YYYY', xAxisInterval: 1, xAxisAngle: -32, xAxisHeight: 64, xAxisTextAnchor: 'end', xAxisPadding: {left: 12, right: 0}, xAxisMinTickGap: 6},
    year:  {axisFormat: 'MMM',    xAxisInterval: 0, xAxisMinTickGap: 0},
};

export const getLiquidUnit = (selectedDevice) => selectedDevice?.settings?.liquid_unit || 'liters';
export const getLiquidUnitSuffix = (unit) => unit === 'gallons' ? 'gal' : 'L';
export const getTemperatureSuffix = (unit) => unit === 'cel' ? '°C' : '°F';

export const formatLiquidValue = (liters, unit, options = {}) => {
    if (!Number.isFinite(liters)) {
        return '--';
    }

    const precision = options.precision ?? (unit === 'gallons' ? 1 : 0);
    const value = unit === 'gallons' ? Number(liters) * GALLONS_PER_LITER : Number(liters);
    return `${round(value, precision)} ${getLiquidUnitSuffix(unit)}`;
};

export const litersToPercent = (liters, capacityLiters) => (
    Number.isFinite(liters) && Number.isFinite(capacityLiters) && capacityLiters > 0
        ? Math.round((liters / capacityLiters) * 100)
        : null
);

export const convertTemperatureSeries = (series = [], unit, precision = 1) => series.map((item) => {
    if (!Number.isFinite(item?.y)) {
        return {...item, y: item?.y};
    }

    const value = unit === 'fah' ? (Number(item.y) * 9) / 5 + 32 : Number(item.y);
    return {...item, y: round(value, precision)};
});

export const getLastMeasurementHelper = (t, timestamp, fallbackLabel = '--') => {
    const value = timestamp ? dayjs(timestamp).format('DD MMM YYYY, HH:mm') : fallbackLabel;
    return t('common.lastMeasurement', {value});
};

export const getMeasurementTrend = (measurements = [], getValue) => {
    if (!Array.isArray(measurements) || measurements.length < 2 || typeof getValue !== 'function') {
        return 0;
    }

    const latestValue = getValue(measurements[0]);
    const oldestValue = getValue(measurements[measurements.length - 1]);
    return Number.isFinite(latestValue) && Number.isFinite(oldestValue) ? latestValue - oldestValue : 0;
};

export const buildSummaryMetrics = (helper, metrics) => metrics.map(({style, progressColor, ...metric}) => ({
    key: style.key,
    helper,
    progressColor: progressColor ?? style.progressColor,
    ...metric,
}));

export const buildChartPanels = (period, panels, {yearTooltipFormat = 'MMM YYYY'} = {}) => {
    const base = PERIOD_AXIS_PROPS[period] ?? {axisFormat: 'DD MMM', tooltipFormat: 'DD MMM YYYY', xAxisInterval: 'preserveStartEnd'};
    const timeProps = period === 'year' ? {...base, tooltipFormat: yearTooltipFormat} : base;
    return panels.map((panel) => ({...panel, ...timeProps}));
};
