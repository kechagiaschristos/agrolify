import {useMemo} from 'react';
import dayjs from 'dayjs';
import {Avatar, Button, Card, Flex, Grid, Skeleton, theme, Typography} from 'antd';
import {CalendarOutlined} from '@ant-design/icons';
import {PiPlantFill} from 'react-icons/pi';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import appThemeConfig from '../../../../shared/theme/appThemeConfig';
import {selectWateringSchedules} from '../../../water/store/wateringSchedulesSelectors';
import {
    formatRuntimeLabel,
    getWateringDayLabel,
    getWateringScheduleStats,
    normalizeWateringSchedule,
    parseScheduleTime,
} from '../../../water/utils/wateringUtils';

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

const dayOrder = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
};

const getOccurrenceDate = (event, reference, direction = 'next') => {
    const eventDayIndex = dayOrder[event.day] ?? 0;
    const referenceDayIndex = reference.day();
    const normalizedReferenceDayIndex = referenceDayIndex === 0 ? 6 : referenceDayIndex - 1;
    const diff = eventDayIndex - normalizedReferenceDayIndex;
    const offset = direction === 'next'
        ? (diff >= 0 ? diff : diff + 7)
        : (diff <= 0 ? diff : diff - 7);
    const parsedTime = parseScheduleTime(event.start);
    let dateTime = reference.add(offset, 'day');

    if (parsedTime.isValid()) {
        dateTime = dateTime
            .set('hour', parsedTime.hour())
            .set('minute', parsedTime.minute());
    }

    dateTime = dateTime
        .set('second', 0)
        .set('millisecond', 0);

    if (direction === 'next' && dateTime.isBefore(reference)) {
        return dateTime.add(7, 'day');
    }

    if (direction === 'previous' && dateTime.isAfter(reference)) {
        return dateTime.subtract(7, 'day');
    }

    return dateTime;
};

export default function IrrigationControlCard({loading = false, onOpenPlanner, stacked = false}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const compactStackedMobile = stacked && !md;
    const cardPadding = compactStackedMobile ? 12 : dashboardCardStyles.padding;
    const sectionGap = compactStackedMobile ? 12 : dashboardCardStyles.sectionGap;
    const headerContentGap = compactStackedMobile ? 8 : (stacked ? 10 : sectionGap);
    const headerGap = compactStackedMobile ? 10 : dashboardCardStyles.headerGap;
    const wateringSchedules = useSelector(selectWateringSchedules);
    const scheduleSummary = useMemo(() => {
        const normalizedSchedules = wateringSchedules.map(normalizeWateringSchedule);
        const {activeOrderedEvents, weeklyRuntime} = getWateringScheduleStats(normalizedSchedules);
        const orderedEvents = [...normalizedSchedules].sort((first, second) => {
            const firstDayIndex = dayOrder[first.day] ?? 0;
            const secondDayIndex = dayOrder[second.day] ?? 0;

            if (firstDayIndex !== secondDayIndex) {
                return firstDayIndex - secondDayIndex;
            }

            return parseScheduleTime(first.start).valueOf() - parseScheduleTime(second.start).valueOf();
        });

        const nextEvent = orderedEvents
            .map((event) => ({
                ...event,
                dateValue: getOccurrenceDate(event, dayjs(), 'next'),
            }))
            .sort((left, right) => left.dateValue.valueOf() - right.dateValue.valueOf())[0] ?? null;
        const previousEvent = orderedEvents
            .map((event) => ({
                ...event,
                dateValue: getOccurrenceDate(event, dayjs(), 'previous'),
            }))
            .sort((left, right) => right.dateValue.valueOf() - left.dateValue.valueOf())[0] ?? null;

        return {
            nextCycleValue: nextEvent
                ? `${getWateringDayLabel(t, nextEvent.day)} ${nextEvent.dateValue.format('h:mm A')}`
                : t('dashboardData.irrigation.noNextRunLabel'),
            previousCycleValue: previousEvent
                ? `${getWateringDayLabel(t, previousEvent.day)} ${previousEvent.dateValue.format('h:mm A')}`
                : t('dashboardData.irrigation.noPreviousRunLabel'),
            activeEventsValue: t('dashboardControls.irrigation.activeEventsValue', {count: activeOrderedEvents.length}),
            weeklyRuntimeValue: formatRuntimeLabel(weeklyRuntime, t),
        };
    }, [t, wateringSchedules]);
    const data = {
        title: t('dashboardControls.irrigation.title'),
        nextCycleLabel: t('dashboardControls.irrigation.nextCycleLabel'),
        previousCycleLabel: t('dashboardControls.irrigation.previousCycleLabel'),
        activeEventsLabel: t('dashboardControls.irrigation.activeEventsLabel'),
        weeklyRuntimeLabel: t('dashboardControls.irrigation.weeklyRuntimeLabel'),
        buttonLabel: t('dashboardControls.irrigation.buttonLabel'),
    };

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
                            icon={(
                                <PiPlantFill
                                    size={compactStackedMobile ? 16 : 18}
                                    style={{
                                        animation: 'plantGrow 2.8s ease-in-out infinite',
                                        transformOrigin: 'bottom center',
                                    }}
                                />
                            )}
                            style={{
                                background: token.colorPrimaryBg,
                                color: token.colorPrimary,
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
                    <Button
                        type="default"
                        size="middle"
                        aria-label={data.buttonLabel}
                        icon={<CalendarOutlined />}
                        style={{
                            width: compactStackedMobile ? 36 : 40,
                            height: compactStackedMobile ? 30 : 32,
                            minWidth: compactStackedMobile ? 36 : 40,
                            paddingInline: 0,
                            borderRadius: 999,
                            borderColor: token.colorBorder,
                            background: token.colorBgElevated,
                            color: token.colorTextSecondary,
                            fontWeight: 700,
                            boxShadow: 'none',
                            flexShrink: 0,
                        }}
                        onClick={onOpenPlanner}
                    />
                </Flex>

                <Flex
                    vertical
                    gap={sectionGap}
                    style={{
                        flex: compactStackedMobile ? undefined : 1,
                        minHeight: compactStackedMobile ? undefined : (stacked ? 120 : 148),
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
                            [data.nextCycleLabel, scheduleSummary.nextCycleValue, 72, 104],
                            [data.previousCycleLabel, scheduleSummary.previousCycleValue, 92, 116],
                            [data.activeEventsLabel, scheduleSummary.activeEventsValue, 82, 58],
                            [data.weeklyRuntimeLabel, scheduleSummary.weeklyRuntimeValue, 86, 76],
                        ].map(([label, value, labelSkeletonWidth, valueSkeletonWidth], index) => (
                            <Flex
                                key={label}
                                vertical
                                gap={4}
                                style={{
                                    minWidth: 0,
                                    paddingBlock: stacked ? 8 : 10,
                                    borderTop: index === 0 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <Typography.Text
                                    style={{
                                        color: token.colorTextTertiary,
                                        fontSize: token.fontSizeSM,
                                        fontWeight: 600,
                                        letterSpacing: 0,
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
                                        color: token.colorText,
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
                    </div>
                </Flex>

            </Flex>
        </Card>
    );
}
