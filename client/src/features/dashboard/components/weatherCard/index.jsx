import {Card, Flex, Grid, Image, Skeleton, theme, Typography} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import appThemeConfig from '../../../../shared/theme/appThemeConfig';
import {fetchWeatherRequest} from '../../store/weatherRequests.js';
import {selectSelectedDeviceDetails} from '../../../devices/store/devicesSelectors.js';
import {getApiErrorMessage} from '../../../../shared/api/apiMessages.js';
import WeatherForecastDetails from './WeatherForecastDetails.jsx';

const cardStyles = appThemeConfig.card.dashboard;
const getCardShellStyle = appThemeConfig.card.styles.shell;
const OPEN_WEATHER_ICON_BASE_URL = 'https://openweathermap.org/img/wn';

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

const SunIcon = ({size = 68}) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="12" fill="#F7C948" />
        {Array.from({length: 8}).map((_, index) => {
            const angle = (index * Math.PI) / 4;
            const x1 = 32 + Math.cos(angle) * 18;
            const y1 = 32 + Math.sin(angle) * 18;
            const x2 = 32 + Math.cos(angle) * 27;
            const y2 = 32 + Math.sin(angle) * 27;

            return (
                <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#F7C948"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            );
        })}
    </svg>
);

const toNumber = (value) => {
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

const toDisplayTemperature = (value, unit = 'cel') => {
    const numericValue = toNumber(value);
    if (!Number.isFinite(numericValue)) {
        return null;
    }

    if (unit === 'fah') {
        return round((numericValue * 9) / 5 + 32, 1);
    }

    return round(numericValue, 1);
};

const formatDate = (value, locale, options) => {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
};

export default function DashboardWeatherCard({minHeight = 0, loading: externalLoading = false}) {
    const {t, i18n} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const selectedDevice = useSelector(selectSelectedDeviceDetails);
    const isMobile = !md;
    const shouldUseFixedHeight = minHeight > 0 && !isMobile;
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [selectedDayDate, setSelectedDayDate] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('temperature');
    const temperatureUnit = selectedDevice?.settings?.temperature_unit || 'cel';
    const temperatureSuffix = temperatureUnit === 'fah' ? '\u00B0F' : '\u00B0C';
    const weatherLocale = i18n.language === 'el' ? 'el' : 'en';

    useEffect(() => {
        if (!selectedDevice?.code) {
            setWeather(null);
            setErrorMessage(null);
            setWeatherLoading(false);
            return;
        }

        let isActive = true;

        const loadWeather = async () => {
            setWeatherLoading(true);
            setErrorMessage(null);

            try {
                const response = await fetchWeatherRequest(weatherLocale);

                if (!isActive) {
                    return;
                }

                setWeather(response.data?.weather ?? null);
                setSelectedDayDate(response.data?.weather?.daily?.[0]?.date ?? null);
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setWeather(null);
                setSelectedDayDate(null);
                setErrorMessage(
                    getApiErrorMessage(error?.response?.data ?? {message: error?.message}),
                );
            } finally {
                if (isActive) {
                    setWeatherLoading(false);
                }
            }
        };

        loadWeather();

        return () => {
            isActive = false;
        };
    }, [selectedDevice?.code, weatherLocale]);

    const current = weather?.current ?? null;
    const dailyForecast = Array.isArray(weather?.daily) ? weather.daily : [];
    const locationLabel = [weather?.location?.name, weather?.location?.country].filter(Boolean).join(', ');
    const currentTemperature = toDisplayTemperature(current?.temperature_c, temperatureUnit);
    const currentWindSpeed = toNumber(current?.wind_speed_mps);
    const currentWindLabel = Number.isFinite(currentWindSpeed) ? `${round(currentWindSpeed, 1)} m/s` : '--';
    const currentIconUrl = current?.icon
        ? `${OPEN_WEATHER_ICON_BASE_URL}/${current.icon}@2x.png`
        : null;
    const selectedDay = dailyForecast.find((day) => day?.date === selectedDayDate) || dailyForecast[0] || null;
    const metricConfig = {
        temperature: {
            label: t('dashboardWeather.tabs.temperature'),
            suffix: temperatureSuffix,
            getValue: (point) => toDisplayTemperature(point?.temperature_c, temperatureUnit),
        },
        wind: {
            label: t('dashboardWeather.tabs.wind'),
            suffix: ' m/s',
            getValue: (point) => round(point?.wind_speed_mps, 1),
        },
    };
    const activeMetric = metricConfig[selectedMetric] || metricConfig.temperature;
    const forecastTrendPoints = Array.isArray(selectedDay?.points)
        ? selectedDay.points
            .map((point) => ({
                label: formatDate(point?.at, i18n.language, {hour: 'numeric'}),
                value: activeMetric.getValue(point),
            }))
            .filter((point) => Number.isFinite(point.value))
        : [];
    const metricTabs = Object.entries(metricConfig).map(([key, config]) => ({
        key,
        label: config.label,
    }));
    const selectedDayTitle = formatDate(selectedDay?.date, i18n.language, {weekday: 'long'});
    const selectedDayDescription = selectedDay?.description || selectedDay?.condition || current?.description || '';
    const selectedDayCondition = selectedDayDescription
        ? selectedDayDescription.charAt(0).toUpperCase() + selectedDayDescription.slice(1)
        : '';
    const selectedDayChartLabel = formatDate(selectedDay?.date, i18n.language, {weekday: 'long', month: 'short', day: 'numeric'});
    const forecastDays = dailyForecast.map((day) => {
        const minTemp = toDisplayTemperature(day?.temp_min_c, temperatureUnit);
        const maxTemp = toDisplayTemperature(day?.temp_max_c, temperatureUnit);

        return {
            key: day.date || day.condition,
            date: day?.date ?? null,
            dayLabel: formatDate(day?.date, i18n.language, {weekday: 'short'}),
            iconUrl: day?.icon ? `${OPEN_WEATHER_ICON_BASE_URL}/${day.icon}.png` : null,
            iconAlt: day?.description || day?.condition || t('dashboardWeather.title'),
            isSelected: day?.date === selectedDay?.date,
            minTemperatureLabel: Number.isFinite(minTemp) ? `${minTemp}${temperatureSuffix}` : '--',
            maxTemperatureLabel: Number.isFinite(maxTemp) ? `${maxTemp}${temperatureSuffix}` : '--',
        };
    });
    const isLoading = externalLoading || weatherLoading;
    const currentMetaRowStyle = {
        fontSize: token.fontSizeSM,
        color: token.colorTextSecondary,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    };

    return (
        <Card
            style={{
                width: '100%',
                ...getCardShellStyle(token),
                ...(shouldUseFixedHeight
                    ? {height: '100%', minHeight}
                    : {height: 'auto', minHeight: 0}),
            }}
            styles={{
                body: {
                    padding: cardStyles.padding,
                    display: 'flex',
                    flexDirection: 'column',
                    ...(shouldUseFixedHeight
                        ? {height: '100%', minHeight: 0}
                        : {height: 'auto'}),
                },
            }}
        >
            <Flex
                vertical
                gap={isMobile ? 12 : cardStyles.sectionGap}
                style={shouldUseFixedHeight ? {height: '100%', minHeight: 0} : undefined}
            >
                <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={isMobile ? 12 : cardStyles.headerGap}
                    style={{minWidth: 0}}
                >
                    <Flex
                        align={isMobile ? 'flex-start' : 'center'}
                        gap={isMobile ? 10 : 14}
                        style={{
                            flex: isMobile ? '1 1 0' : '1 1 320px',
                            minWidth: 0,
                        }}
                    >
                        {isLoading ? (
                            <SkeletonText
                                width={isMobile ? 40 : 64}
                                height={isMobile ? 40 : 64}
                                radius={999}
                            />
                        ) : currentIconUrl ? (
                            <Image
                                src={currentIconUrl}
                                alt={current?.description || t('dashboardWeather.title')}
                                width={isMobile ? 40 : 64}
                                height={isMobile ? 40 : 64}
                                preview={false}
                            />
                        ) : (
                            <SunIcon size={isMobile ? 40 : 64} />
                        )}
                        <Flex vertical gap={isMobile ? 4 : 8} style={{minWidth: 0, flex: 1}}>
                            <Typography.Title
                                level={1}
                                style={{
                                    margin: 0,
                                    fontSize: token.fontSizeHeading1,
                                    lineHeight: 1.05,
                                    letterSpacing: 0,
                                    color: token.colorText,
                                }}
                            >
                                {isLoading ? (
                                    <SkeletonText
                                        width={isMobile ? 92 : 128}
                                        height={isMobile ? 32 : 42}
                                    />
                                ) : (
                                    Number.isFinite(currentTemperature) ? `${currentTemperature}${temperatureSuffix}` : '--'
                                )}
                            </Typography.Title>
                            <Flex vertical gap={2} style={{minWidth: 0}}>
                                <div
                                    style={currentMetaRowStyle}
                                >
                                    <span>{t('dashboardWeather.metaLabels.humidity')}:</span>
                                    {isLoading ? (
                                        <SkeletonText width={36} height={12} />
                                    ) : (
                                        <span>{toNumber(current?.humidity) ?? '--'}%</span>
                                    )}
                                </div>
                                <div
                                    style={currentMetaRowStyle}
                                >
                                    <span>{t('dashboardWeather.metaLabels.wind')}:</span>
                                    {isLoading ? (
                                        <SkeletonText width={54} height={12} />
                                    ) : (
                                        <span>{currentWindLabel}</span>
                                    )}
                                </div>
                            </Flex>
                        </Flex>
                    </Flex>

                    <Flex
                        vertical
                        align="flex-end"
                        gap={isMobile ? 2 : 6}
                        style={{
                            flex: '0 0 auto',
                            minWidth: isMobile ? 96 : 160,
                            maxWidth: isMobile ? 132 : 240,
                            textAlign: 'right',
                        }}
                    >
                        <Typography.Title
                            level={2}
                            style={{
                                margin: 0,
                                color: token.colorText,
                                fontSize: token.fontSizeHeading4,
                                fontWeight: 750,
                                lineHeight: 1.1,
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {isLoading ? (
                                <SkeletonText width={isMobile ? 86 : 128} height={isMobile ? 20 : 26} />
                            ) : (
                                selectedDayCondition || t('common.noData')
                            )}
                        </Typography.Title>
                        <Typography.Text
                            style={{
                                fontSize: token.fontSizeSM,
                                fontWeight: 600,
                                lineHeight: 1.2,
                                color: token.colorTextSecondary,
                            }}
                        >
                            {isLoading ? (
                                <SkeletonText width={isMobile ? 74 : 104} height={12} />
                            ) : selectedDayTitle}
                        </Typography.Text>
                        {!isLoading && locationLabel ? (
                            <Typography.Text
                                style={{
                                    fontSize: token.fontSizeSM,
                                    lineHeight: 1.2,
                                    color: token.colorTextTertiary,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {locationLabel}
                            </Typography.Text>
                        ) : null}
                    </Flex>
                </Flex>

                <WeatherForecastDetails
                    activeMetric={activeMetric}
                    chartAriaLabel={t('dashboardWeather.chartAria', {
                        metric: activeMetric.label,
                        day: selectedDayChartLabel,
                    })}
                    errorMessage={errorMessage}
                    forecastDays={forecastDays}
                    forecastTrendPoints={forecastTrendPoints}
                    hasWeatherData={Boolean(current && dailyForecast.length)}
                    isLoading={isLoading}
                    isMobile={isMobile}
                    metricTabs={metricTabs}
                    onMetricChange={setSelectedMetric}
                    onSelectDay={setSelectedDayDate}
                    selectedMetric={selectedMetric}
                    shouldUseFixedHeight={shouldUseFixedHeight}
                    t={t}
                    token={token}
                />
            </Flex>
        </Card>
    );
}
