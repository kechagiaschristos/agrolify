import dayjs from 'dayjs';
import {Avatar, Button, Card, Flex, Grid, Skeleton, theme, Typography} from 'antd';
import {BgColorsOutlined, LineChartOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import appThemeConfig from '../../../../shared/theme/appThemeConfig';
import {formatLiquidValue, getLiquidUnit, getLiquidUnitSuffix, getMeasurementTrend} from '../../../../shared/components/workspace/utils';
import {
    getMeasurementTimestamp,
    getWaterMetrics,
    toFiniteNumber,
} from '../../../../shared/utils/measurementSnapshot';
import {selectSelectedDeviceDetails} from '../../../devices/store/devicesSelectors';
import {selectLatestMeasurements} from '../../../measurements/store/measurementsSelectors';

const dashboardCardStyles = appThemeConfig.card.dashboard;
const getCardNestedPanelStyle = appThemeConfig.card.styles.nestedPanel;
const getSiteCardShellStyle = appThemeConfig.card.styles.shell;
const singleLineTextStyle = {
    minWidth: 0,
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'normal',
    overflowWrap: 'normal',
};

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

const getWaterStatusTone = (level, data, token) => {
    if (!Number.isFinite(level) || level <= 20) {
        return {
            label: data.lowLabel,
            tagBackground: '#fff7e6',
            tagColor: '#b45309',
            valueColor: '#b45309',
            iconBackground: token.colorPrimaryBg,
            iconColor: token.colorPrimary,
        };
    }

    return {
        label: data.healthyLabel,
        tagBackground: '#e8f7ee',
        tagColor: '#166534',
        valueColor: token.colorPrimary,
        iconBackground: token.colorPrimaryBg,
        iconColor: token.colorPrimary,
    };
};

const getAutonomyDays = (currentWaterLiters, dailyDraw) => (
    Number.isFinite(currentWaterLiters) && typeof dailyDraw === 'number' && dailyDraw > 0
        ? Math.max(1, Math.round(currentWaterLiters / dailyDraw))
        : '--'
);

export default function WaterTankStatusCard({loading = false, onOpenHistory, stacked = false}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const compactStackedMobile = stacked && !md;
    const cardPadding = compactStackedMobile ? 12 : dashboardCardStyles.padding;
    const sectionGap = compactStackedMobile ? 12 : dashboardCardStyles.sectionGap;
    const headerContentGap = compactStackedMobile ? 8 : (stacked ? 10 : sectionGap);
    const headerGap = compactStackedMobile ? 10 : dashboardCardStyles.headerGap;
    const data = {
        title: t('dashboardControls.water.title'),
        healthyLabel: t('dashboardControls.water.healthyLabel'),
        lowLabel: t('dashboardControls.water.lowLabel'),
        levelLabel: t('dashboardControls.water.levelLabel'),
        autonomyLabel: t('dashboardControls.water.autonomyShortLabel'),
        dailyDrawLabel: t('dashboardControls.water.dailyDrawShortLabel'),
        lastMeasurementPrefix: t('dashboardControls.water.lastMeasurementPrefix'),
        emptyMeasurementLabel: t('dashboardControls.water.emptyMeasurementLabel'),
    };
    const selectedDevice = useSelector(selectSelectedDeviceDetails);
    const latestMeasurements = useSelector(selectLatestMeasurements);
    const selectedDeviceMeasurements = latestMeasurements.filter(
        (measurement) => String(measurement?.device_id ?? null) === String(selectedDevice?.id ?? null),
    );
    const latestMeasurement = selectedDeviceMeasurements[0] ?? null;

    const {level: waterLevel, liters: waterLiters} = getWaterMetrics({
        selectedDevice,
        latestMeasurement,
    });
    const liquidUnit = getLiquidUnit(selectedDevice);
    const measurementTimestamp = getMeasurementTimestamp(latestMeasurement);
    const recentWaterTrend = getMeasurementTrend(selectedDeviceMeasurements, (measurement) => toFiniteNumber(measurement?.water_level_liters));
    const drawValue = Math.max(0, Math.round(Math.abs(Math.min(recentWaterTrend, 0)))) || '--';
    const autonomyDays = getAutonomyDays(waterLiters, drawValue);
    const tone = loading
        ? {
            iconBackground: token.colorPrimaryBg,
            iconColor: token.colorPrimary,
            valueColor: token.colorText,
        }
        : getWaterStatusTone(waterLevel, data, token);

    return (
        <Card
            style={{
                ...getSiteCardShellStyle(token),
                ...(stacked && !compactStackedMobile ? {flex: 1, height: '100%', minHeight: 316} : {}),
            }}
            styles={{
                body: {
                    padding: cardPadding,
                    height: '100%',
                },
            }}
        >
            <Flex vertical gap={headerContentGap} style={{height: '100%', minHeight: 0}}>
                <Flex justify="space-between" align="flex-start" gap={headerGap}>
                    <Flex align="flex-start" gap={headerGap} flex={1} style={{minWidth: 0}}>
                        <Avatar
                            size={compactStackedMobile ? 30 : (stacked ? 34 : 40)}
                            icon={<BgColorsOutlined />}
                            style={{
                                background: tone.iconBackground,
                                color: tone.iconColor,
                                flexShrink: 0,
                            }}
                        />
                        <Flex vertical gap={stacked ? 4 : 2} style={{minWidth: 0, flex: 1}}>
                            <Typography.Title
                                level={5}
                                style={{
                                    margin: 0,
                                    fontSize: token.fontSizeLG,
                                    lineHeight: 1.2,
                                    color: token.colorText,
                                    ...singleLineTextStyle,
                                }}
                            >
                                {data.title}
                            </Typography.Title>
                        </Flex>
                    </Flex>
                    {onOpenHistory ? (
                        <Button
                            type="default"
                            size="middle"
                            aria-label={t('dashboardMetricCard.openTrendAria', {metric: data.title})}
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
                                flexShrink: 0,
                            }}
                            onClick={onOpenHistory}
                        />
                    ) : null}
                </Flex>

                <Flex
                    vertical
                    gap={sectionGap}
                    style={{
                        flex: compactStackedMobile ? undefined : 1,
                        minHeight: compactStackedMobile ? undefined : (stacked ? 58 : 104),
                        justifyContent: compactStackedMobile ? undefined : 'space-between',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0,
                            ...getCardNestedPanelStyle(token),
                            padding: compactStackedMobile ? '4px 12px' : '6px 14px',
                        }}
                    >
                        {[
                            [
                                data.levelLabel,
                                Number.isFinite(waterLevel) ? `${waterLevel}%` : '--',
                                66,
                                64,
                                tone.valueColor,
                            ],
                            [
                                data.autonomyLabel,
                                typeof autonomyDays === 'number' ? `${autonomyDays} ${t('common.dayUnit', {count: autonomyDays})}` : '--',
                                70,
                                62,
                                token.colorText,
                            ],
                            [
                                data.dailyDrawLabel,
                                typeof drawValue === 'number' ? `${drawValue} ${getLiquidUnitSuffix(liquidUnit)}` : '--',
                                62,
                                54,
                                token.colorText,
                            ],
                        ].map(([label, value, labelSkeletonWidth, valueSkeletonWidth, valueColor], index) => (
                            <Flex
                                key={label}
                                vertical
                                gap={4}
                                style={{
                                    minWidth: 0,
                                    paddingBlock: 10,
                                    borderTop: index === 0 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <Typography.Text
                                    style={{
                                        color: token.colorTextTertiary,
                                        fontSize: token.fontSizeSM,
                                        fontWeight: 600,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {loading ? (
                                        <SkeletonText width={labelSkeletonWidth} height={10} />
                                    ) : label}
                                </Typography.Text>
                                <Typography.Text
                                    strong
                                    style={{
                                        color: valueColor,
                                        fontSize: token.fontSize,
                                        lineHeight: 1.3,
                                        ...singleLineTextStyle,
                                    }}
                                >
                                    {loading ? (
                                        <SkeletonText width={valueSkeletonWidth} height={13} />
                                    ) : value}
                                </Typography.Text>
                            </Flex>
                        ))}

                        {(loading || Number.isFinite(waterLiters)) && (
                            <Typography.Text
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: token.fontSizeSM,
                                    lineHeight: 1.2,
                                    paddingBottom: 10,
                                    ...singleLineTextStyle,
                                }}
                            >
                                {loading ? (
                                    <SkeletonText width={96} height={10} />
                                ) : (
                                    `${formatLiquidValue(waterLiters, selectedDevice?.settings?.liquid_unit)} ${t('common.availableSuffix')}`
                                )}
                            </Typography.Text>
                        )}
                    </div>
                </Flex>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <Typography.Text
                        style={{
                            color: token.colorTextTertiary,
                            fontSize: token.fontSizeSM,
                            lineHeight: 1.2,
                            ...singleLineTextStyle,
                        }}
                    >
                        {data.lastMeasurementPrefix}{' '}
                        {loading ? (
                            <SkeletonText width={104} height={10} />
                        ) : (
                            measurementTimestamp ? dayjs(measurementTimestamp).format('DD MMM, HH:mm') : data.emptyMeasurementLabel
                        )}
                    </Typography.Text>
                </div>
            </Flex>
        </Card>
    );
}
