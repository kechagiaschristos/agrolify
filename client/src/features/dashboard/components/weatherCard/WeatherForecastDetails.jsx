import {CloudOutlined} from '@ant-design/icons';
import {Alert, Card, Empty, Flex, Image, Skeleton, Tabs, Typography} from 'antd';
import {Area, AreaChart, LabelList, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis} from 'recharts';
import appThemeConfig from '../../../../shared/theme/appThemeConfig';

const cardStyles = appThemeConfig.card.dashboard;
const WEATHER_CHART_LINE_COLOR = '#f0b100';
const WEATHER_CHART_GRADIENT_ID = 'weather-forecast-fill';

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

const getWeatherCardStyles = (token, isMobile) => `
    .dashboard-weather-chart .recharts-wrapper:focus,
    .dashboard-weather-chart .recharts-wrapper:focus-visible,
    .dashboard-weather-chart .recharts-surface:focus,
    .dashboard-weather-chart .recharts-surface:focus-visible,
    .dashboard-weather-chart svg:focus,
    .dashboard-weather-chart svg:focus-visible {
        outline: none !important;
        box-shadow: none !important;
    }

    .dashboard-weather-tabs .ant-tabs-nav {
        margin: 0 0 8px 0 !important;
    }

    .dashboard-weather-tabs .ant-tabs-nav::before {
        border-bottom: none !important;
    }

    .dashboard-weather-tabs .ant-tabs-tab {
        padding: 0 0 10px !important;
        color: ${token.colorTextSecondary};
        font-size: ${isMobile ? token.fontSizeSM : token.fontSize}px;
    }

    .dashboard-weather-tabs .ant-tabs-tab + .ant-tabs-tab {
        margin-left: ${isMobile ? 16 : 22}px !important;
    }

    .dashboard-weather-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
        color: ${token.colorText} !important;
    }

    .dashboard-weather-tabs .ant-tabs-ink-bar {
        height: 3px !important;
        border-radius: 999px !important;
        background: ${WEATHER_CHART_LINE_COLOR} !important;
    }
`;

function WeatherTrendTooltip({active, payload, label, suffix, token}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <Card
            size="small"
            styles={{body: {padding: 10}}}
            style={{
                borderRadius: token.borderRadiusLG,
                background: token.colorBgElevated,
                borderColor: token.colorBorderSecondary,
                boxShadow: token.boxShadowSecondary,
            }}
        >
            <Flex vertical gap={2}>
                <Typography.Text strong style={{fontSize: token.fontSizeSM}}>
                    {label}
                </Typography.Text>
                <Typography.Text type="secondary" style={{fontSize: token.fontSizeSM}}>
                    {payload[0].value}{suffix}
                </Typography.Text>
            </Flex>
        </Card>
    );
}

function WeatherTrendChart({points, suffix, token, ariaLabel, isMobile}) {
    if (!Array.isArray(points) || points.length === 0) {
        return null;
    }

    return (
        <>
            <style>{getWeatherCardStyles(token, isMobile)}</style>
            <div
                style={{
                    width: '100%',
                    height: isMobile ? 160 : 190,
                    paddingTop: isMobile ? 6 : 10,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(240, 177, 0, 0.04) 100%)',
                }}
            >
                <div
                    className="dashboard-weather-chart"
                    role="img"
                    aria-label={ariaLabel}
                    style={{width: '100%', height: '100%'}}
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{width: 400, height: isMobile ? 160 : 190}}>
                        <AreaChart
                            data={points}
                            margin={{
                                top: isMobile ? 24 : 30,
                                right: isMobile ? 14 : 28,
                                bottom: 4,
                                left: isMobile ? 2 : 12,
                            }}
                        >
                            <defs>
                                <linearGradient id={WEATHER_CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={WEATHER_CHART_LINE_COLOR} stopOpacity={0.32} />
                                    <stop offset="100%" stopColor={WEATHER_CHART_LINE_COLOR} stopOpacity={0.08} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: token.colorTextTertiary, fontSize: token.fontSizeSM}}
                            />
                            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                            <RechartsTooltip
                                cursor={false}
                                content={<WeatherTrendTooltip suffix={suffix} token={token} />}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={WEATHER_CHART_LINE_COLOR}
                                strokeWidth={2.5}
                                fill={`url(#${WEATHER_CHART_GRADIENT_ID})`}
                                dot={{r: 0}}
                                activeDot={{r: 4, fill: token.colorBgElevated, stroke: WEATHER_CHART_LINE_COLOR, strokeWidth: 2}}
                            >
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    offset={8}
                                    formatter={(value) => `${value}${suffix}`}
                                    style={{fill: token.colorTextSecondary, fontSize: token.fontSizeSM, fontWeight: 600}}
                                />
                            </Area>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

function WeatherLoadingDetails({isMobile, metricTabs, selectedMetric, onMetricChange, token}) {
    return (
        <Flex vertical gap={isMobile ? 12 : cardStyles.sectionGap} style={{minHeight: 0}}>
            <Tabs
                activeKey={selectedMetric}
                onChange={onMetricChange}
                items={metricTabs}
                size="small"
                className="dashboard-weather-tabs"
                style={{marginTop: isMobile ? 0 : -4}}
            />

            <SkeletonText
                block
                height={isMobile ? 160 : 190}
                radius={token.borderRadiusLG}
                style={{display: 'block'}}
            />

            <Flex gap={isMobile ? 10 : cardStyles.sectionGap} wrap="wrap">
                {Array.from({length: isMobile ? 3 : 5}, (_, index) => (
                    <Card
                        key={`weather-skeleton-${index}`}
                        size="small"
                        style={{
                            flex: isMobile ? '1 1 calc(33.333% - 11px)' : '1 1 88px',
                            minWidth: isMobile ? 74 : 88,
                            borderRadius: 14,
                            borderColor: 'transparent',
                            background: token.colorFillQuaternary,
                            boxShadow: 'none',
                        }}
                        styles={{body: {padding: isMobile ? '8px 6px' : '10px 8px'}}}
                    >
                        <Flex vertical align="center" gap={8}>
                            <SkeletonText width={isMobile ? 34 : 42} height={12} />
                            <SkeletonText
                                width={isMobile ? 32 : 40}
                                height={isMobile ? 32 : 40}
                                radius={999}
                            />
                            <SkeletonText width={isMobile ? 48 : 58} height={14} />
                        </Flex>
                    </Card>
                ))}
            </Flex>
        </Flex>
    );
}

export default function WeatherForecastDetails({
    activeMetric,
    chartAriaLabel,
    errorMessage,
    forecastDays,
    forecastTrendPoints,
    hasWeatherData,
    isLoading,
    isMobile,
    metricTabs,
    onMetricChange,
    onSelectDay,
    selectedMetric,
    shouldUseFixedHeight,
    t,
    token,
}) {
    if (isLoading) {
        return (
            <WeatherLoadingDetails
                isMobile={isMobile}
                metricTabs={metricTabs}
                onMetricChange={onMetricChange}
                selectedMetric={selectedMetric}
                token={token}
            />
        );
    }

    if (errorMessage) {
        return (
            <Flex flex={1} align="center" justify="center" style={{minHeight: 0}}>
                <Alert
                    type="warning"
                    showIcon
                    message={errorMessage}
                    style={{width: '100%', borderRadius: token.borderRadiusLG}}
                />
            </Flex>
        );
    }

    if (!hasWeatherData) {
        return (
            <Flex flex={1} align="center" justify="center" style={{padding: '20px 0', minHeight: 0}}>
                <Empty description={t('common.noData')} />
            </Flex>
        );
    }

    return (
        <Flex
            vertical
            gap={isMobile ? 12 : cardStyles.sectionGap}
            style={{
                minHeight: 0,
                ...(shouldUseFixedHeight ? {flex: 1} : {}),
                justifyContent: shouldUseFixedHeight ? 'space-between' : 'flex-start',
            }}
        >
            <Tabs
                activeKey={selectedMetric}
                onChange={onMetricChange}
                items={metricTabs}
                size="small"
                className="dashboard-weather-tabs"
                style={{marginTop: isMobile ? 0 : -4}}
            />

            <WeatherTrendChart
                points={forecastTrendPoints}
                suffix={activeMetric.suffix}
                token={token}
                isMobile={isMobile}
                ariaLabel={chartAriaLabel}
            />

            <Flex gap={isMobile ? 10 : cardStyles.sectionGap} wrap="wrap">
                {forecastDays.map((day) => (
                    <Card
                        key={day.key}
                        size="small"
                        hoverable
                        onClick={() => onSelectDay(day.date)}
                        style={{
                            flex: isMobile ? '1 1 calc(33.333% - 11px)' : '1 1 88px',
                            minWidth: isMobile ? 74 : 88,
                            borderRadius: 14,
                            cursor: 'pointer',
                            borderColor: 'transparent',
                            background: day.isSelected ? token.colorFillSecondary : 'transparent',
                            boxShadow: 'none',
                        }}
                        styles={{body: {padding: isMobile ? '8px 6px' : '10px 8px'}}}
                    >
                        <Flex vertical align="center" gap={8}>
                            <Typography.Text strong style={{color: token.colorText, fontSize: token.fontSizeSM}}>
                                {day.dayLabel}
                            </Typography.Text>
                            {day.iconUrl ? (
                                <Image
                                    src={day.iconUrl}
                                    alt={day.iconAlt}
                                    width={isMobile ? 32 : 40}
                                    height={isMobile ? 32 : 40}
                                    preview={false}
                                />
                            ) : (
                                <CloudOutlined style={{fontSize: token.fontSizeHeading3, color: token.colorTextTertiary}} />
                            )}
                            <Typography.Text
                                style={{
                                    fontWeight: 600,
                                    fontSize: token.fontSize,
                                    color: token.colorText,
                                    textAlign: 'center',
                                    lineHeight: 1.35,
                                }}
                            >
                                {day.maxTemperatureLabel}{' '}
                                <span style={{color: token.colorTextSecondary, fontWeight: 500}}>
                                    {day.minTemperatureLabel}
                                </span>
                            </Typography.Text>
                        </Flex>
                    </Card>
                ))}
            </Flex>
        </Flex>
    );
}
