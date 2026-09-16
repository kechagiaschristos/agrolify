import dayjs from 'dayjs';
import {Button, Card, Grid, Skeleton, theme, Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import {ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, LineChartOutlined} from '@ant-design/icons';
import {Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis} from 'recharts';
import appThemeConfig from '../../../shared/theme/appThemeConfig';

const dashboardCardStyles = appThemeConfig.card.dashboard;
const getCardTooltipStyle = appThemeConfig.card.styles.tooltip;
const getSiteCardShellStyle = appThemeConfig.card.styles.shell;

function SkeletonText({width = 80, height = 16, block = false, radius = 4, style}) {
    return (
        <Skeleton.Input
            active
            size="small"
            block={block}
            aria-hidden="true"
            style={{
                width: block ? '100%' : width,
                minWidth: block ? 0 : width,
                height,
                borderRadius: radius,
                display: 'inline-block',
                lineHeight: `${height}px`,
                verticalAlign: 'middle',
                ...style,
            }}
        />
    );
}

const getTrendMeta = (token) => ({
    rising: {
        icon: <ArrowUpOutlined aria-hidden="true" />,
        textColor: token.colorPrimary,
        background: token.colorPrimaryBg,
        borderColor: token.colorPrimaryBorder,
    },
    falling: {
        icon: <ArrowDownOutlined aria-hidden="true" />,
        textColor: '#d97706',
        background: 'rgba(245, 158, 11, 0.16)',
        borderColor: 'rgba(245, 158, 11, 0.24)',
    },
    stable: {
        icon: <ArrowRightOutlined aria-hidden="true" />,
        textColor: token.colorTextSecondary,
        background: token.colorFillTertiary,
        borderColor: token.colorBorderSecondary,
    },
});

const CHART_FOCUS_RESET = `
    .dashboard-metric-chart .recharts-wrapper:focus,
    .dashboard-metric-chart .recharts-wrapper:focus-visible,
    .dashboard-metric-chart .recharts-surface:focus,
    .dashboard-metric-chart .recharts-surface:focus-visible,
    .dashboard-metric-chart svg:focus,
    .dashboard-metric-chart svg:focus-visible {
        outline: none !important;
        box-shadow: none !important;
    }
`;

function ChartTooltip({active, payload, label, unit, token}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div
            style={{
                ...getCardTooltipStyle(token),
            }}
        >
            <div style={{fontSize: token.fontSizeSM, fontWeight: 600, color: token.colorText}}>
                {dayjs(label).format('HH:mm')}
            </div>
            <div style={{fontSize: token.fontSizeSM, color: token.colorTextSecondary}}>
                {payload[0].value}{unit ? ` ${unit}` : ''}
            </div>
        </div>
    );
}

function MetricChart({points = [], unit = '', ariaLabel, height = 72, token}) {
    if (!Array.isArray(points) || points.length === 0) {
        return <div style={{height}} aria-hidden="true" />;
    }

    return (
        <div
            className="dashboard-metric-chart"
            role="img"
            aria-label={ariaLabel}
            style={{width: '100%', minWidth: 0, height, minHeight: height, outline: 'none'}}
            onMouseDown={(event) => event.preventDefault()}
        >
            <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={height} initialDimension={{width: 200, height}}>
                <AreaChart data={points} margin={{top: 6, right: 0, bottom: 0, left: 0}}>
                    <defs>
                        <linearGradient id="metric-trend-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={token.colorPrimary} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={token.colorPrimary} stopOpacity={0.03} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <RechartsTooltip cursor={false} content={<ChartTooltip unit={unit} token={token} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={token.colorPrimary}
                        strokeWidth={3}
                        fill="url(#metric-trend-fill)"
                        dot={false}
                        activeDot={{r: 4, fill: token.colorBgElevated, stroke: token.colorPrimary, strokeWidth: 2}}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

const getMetricValueLabel = (metric) => (
    Number.isFinite(metric?.value)
        ? `${metric.value}${metric.suffix ? ` ${metric.suffix}` : ''}`
        : '--'
);

export default function DashboardMetricCard({metric, loading = false, onOpenHistory}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const isMobile = !md;
    const trendMeta = getTrendMeta(token);
    const trend = trendMeta[metric?.trendState] || trendMeta.stable;
    const targetBandPrefix = t('dashboardMetricCard.targetBand', {value: ''}).trimEnd();
    const lastMeasurementPrefix = t('dashboardMetricCard.lastMeasurement', {value: ''}).trimEnd();

    return (
        <Card
            style={{
                ...getSiteCardShellStyle(token),
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            styles={{body: {padding: dashboardCardStyles.padding}}}
        >
            <style>{CHART_FOCUS_RESET}</style>
            <div style={{display: 'flex', flexDirection: 'column', gap: dashboardCardStyles.sectionGap, height: '100%'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: dashboardCardStyles.headerGap, alignItems: 'flex-start'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center'}}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '2px 0',
                                borderRadius: 999,
                                border: 'none',
                                background: 'transparent',
                                color: trend.textColor,
                                fontSize: token.fontSizeSM,
                                fontWeight: 700,
                                lineHeight: 1.2,
                            }}
                        >
                            {loading ? (
                                <SkeletonText width={58} height={14} />
                            ) : (
                                <>
                                    {trend.icon}
                                    {metric.trendLabel}
                                </>
                            )}
                        </span>
                    </div>

                    <Button
                        type="default"
                        size="middle"
                        aria-label={t('dashboardMetricCard.openTrendAria', {metric: metric.title})}
                        icon={<LineChartOutlined />}
                        style={{
                            width: 40,
                            height: 32,
                            minWidth: 40,
                            paddingInline: 0,
                            borderRadius: 999,
                            borderColor: token.colorBorder,
                            background: token.colorBgElevated,
                            color: token.colorTextSecondary,
                            fontWeight: 700,
                            boxShadow: 'none',
                        }}
                        onClick={() => onOpenHistory(metric.route)}
                    />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <Typography.Text
                        strong
                        style={{
                            fontSize: token.fontSize,
                            color: token.colorText,
                        }}
                    >
                        {metric.title}
                    </Typography.Text>
                    <Typography.Title
                        level={2}
                        style={{
                            margin: 0,
                            fontSize: token.fontSizeHeading3,
                            lineHeight: 1.08,
                            letterSpacing: 0,
                            color: token.colorText,
                        }}
                    >
                        {loading ? (
                            <SkeletonText width={isMobile ? 84 : 112} height={isMobile ? 22 : 28} />
                        ) : getMetricValueLabel(metric)}
                    </Typography.Title>
                </div>

                {loading ? (
                    <SkeletonText block height={34} radius={token.borderRadius} />
                ) : (
                    <MetricChart
                        points={metric.points}
                        unit={metric.suffix}
                        ariaLabel={metric.chartAriaLabel}
                        height={34}
                        token={token}
                    />
                )}

                <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto'}}>
                    <div
                        style={{
                            color: token.colorTextSecondary,
                            fontSize: token.fontSizeSM,
                            lineHeight: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>{targetBandPrefix}</span>
                        {loading ? (
                            <SkeletonText width={86} height={12} />
                        ) : (
                            <span>{metric.rangeLabel}</span>
                        )}
                    </div>
                    <div
                        style={{
                            color: token.colorTextTertiary,
                            fontSize: token.fontSizeSM,
                            lineHeight: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>{lastMeasurementPrefix}</span>
                        {loading ? (
                            <SkeletonText width={104} height={12} />
                        ) : (
                            <span>{metric.lastMeasurementLabel}</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
