import {useEffect, useMemo} from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import {Empty, Space, Spin, Tag, theme, Typography} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {fetchWateringLogs, resetWateringLogs} from '../store/wateringLogsSlice.js';
import {
    selectFetchWateringLogsLoading,
    selectWateringLogs,
    selectWateringLogsPage,
    selectWateringLogsTotal,
} from '../store/wateringLogsSelectors.js';
import {useTranslation} from 'react-i18next';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const SCROLL_CONTAINER_HEIGHT = 420;
const SCROLL_BOTTOM_OFFSET = 48;

const getStatusColor = (status) => {
    if (status === 'finished') {
        return 'green';
    }

    if (status === 'running') {
        return 'lime';
    }

    if (status === 'starting' || status === 'stopping') {
        return 'gold';
    }

    return 'default';
};

const getDurationLabel = (startedAt, finishedAt, t) => {
    if (!startedAt || !finishedAt) {
        return t('common.notAvailable');
    }

    const diffMinutes = dayjs(finishedAt).diff(dayjs(startedAt), 'minute');

    if (diffMinutes <= 0) {
        return `0 ${t('common.minuteUnit')}`;
    }

    return `${diffMinutes} ${t('common.minuteUnit')}`;
};

export default function WateringLogsList({enabled = false, selectedDevice}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const dispatch = useDispatch();
    const logs = useSelector(selectWateringLogs);
    const total = useSelector(selectWateringLogsTotal);
    const page = useSelector(selectWateringLogsPage);
    const loading = useSelector(selectFetchWateringLogsLoading);
    useEffect(() => {
        if (!enabled || !selectedDevice?.id) {
            dispatch(resetWateringLogs());
            return;
        }

        dispatch(resetWateringLogs());
        dispatch(fetchWateringLogs({page: 1}));
    }, [dispatch, enabled, selectedDevice?.id]);

    const hasMore = logs.length < total;

    const loadNextPage = () => {
        if (!enabled || loading || !hasMore) {
            return;
        }

        dispatch(fetchWateringLogs({page: page + 1}));
    };

    const handleScroll = (event) => {
        const {scrollTop, scrollHeight, clientHeight} = event.currentTarget;

        if (scrollHeight - scrollTop - clientHeight <= SCROLL_BOTTOM_OFFSET) {
            loadNextPage();
        }
    };

    const items = useMemo(() => logs.map((log) => {
        const startedAt = log?.started_at ? dayjs(log.started_at) : null;
        const finishedAt = log?.finished_at ? dayjs(log.finished_at) : null;

        return {
            ...log,
            title: startedAt?.isValid()
                ? startedAt.format('ddd, D MMM YYYY HH:mm')
                : t('common.notAvailable'),
            startedAgo: startedAt?.isValid()
                ? startedAt.fromNow()
                : t('common.notAvailable'),
            durationLabel: getDurationLabel(log?.started_at, log?.finished_at, t),
            waterUsedLabel: typeof log?.water_used_liters === 'number'
                ? `${log.water_used_liters} L`
                : t('common.notAvailable'),
            finishedLabel: finishedAt?.isValid()
                ? finishedAt.format('HH:mm')
                : t('common.notAvailable'),
        };
    }), [logs, t]);

    if (loading && logs.length === 0) {
        return (
            <div style={{padding: '40px 0', textAlign: 'center'}}>
                <Spin size="large" />
            </div>
        );
    }

    if (!loading && logs.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('watering.drawer.noWateringLogs')}
            />
        );
    }

    return (
        <div
            onScroll={handleScroll}
            style={{
                maxHeight: SCROLL_CONTAINER_HEIGHT,
                overflowY: 'auto',
                paddingRight: 4,
            }}
        >
            <div style={{display: 'flex', flexDirection: 'column'}}>
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        style={{
                            padding: '12px 0',
                            borderBottom: index < items.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                        }}
                    >
                        <Space orientation="vertical" size={6} style={{width: '100%'}}>
                            <Space wrap size={8} style={{justifyContent: 'space-between', width: '100%'}}>
                                <Typography.Text strong>{item.title}</Typography.Text>
                                <Tag color={getStatusColor(item.status)}>
                                    {t(`watering.drawer.logStatus.${item.status}`, {defaultValue: item.status})}
                                </Tag>
                            </Space>

                            <Typography.Text type="secondary">
                                {t('watering.drawer.logStartedAt', {value: item.startedAgo})}
                            </Typography.Text>

                            <Space size={16} wrap>
                                <Typography.Text>
                                    {t('watering.drawer.logDuration', {value: item.durationLabel})}
                                </Typography.Text>
                                <Typography.Text>
                                    {t('watering.drawer.logWaterUsed', {value: item.waterUsedLabel})}
                                </Typography.Text>
                                <Typography.Text>
                                    {t('watering.drawer.logFinishedAt', {value: item.finishedLabel})}
                                </Typography.Text>
                            </Space>
                        </Space>
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{padding: '8px 0 16px', textAlign: 'center'}}>
                    <Spin />
                </div>
            ) : null}
        </div>
    );
}
