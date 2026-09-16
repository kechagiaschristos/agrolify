import {useEffect, useState} from 'react';
import {CloseOutlined} from '@ant-design/icons';
import {
    Alert as AntAlert,
    Button,
    Empty,
    Flex,
    Space,
    Spin,
    Typography,
    theme,
} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {useTranslation} from 'react-i18next';
import {
    deleteNotification,
    fetchNotifications,
    markNotificationAsRead,
} from '../../features/notifications/store/notificationsSlice.js';
import {
    selectDeleteNotificationErrorMessage,
    selectDeleteNotificationLoading,
    selectFetchNotificationsErrorMessage,
    selectHasFetchedNotifications,
    selectFetchNotificationsLoading,
    selectNotifications,
    selectNotificationsTotal,
    selectUpdateNotificationErrorMessage,
} from '../../features/notifications/store/notificationsSelectors.js';

dayjs.extend(relativeTime);

const {Paragraph, Text} = Typography;

function Notifications({enabled = false, panelWidth = 360}) {
    const {token} = theme.useToken();
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const notifications = useSelector(selectNotifications);
    const totalNotifications = useSelector(selectNotificationsTotal);
    const hasFetchedNotifications = useSelector(selectHasFetchedNotifications);
    const fetchLoading = useSelector(selectFetchNotificationsLoading);
    const deleteLoading = useSelector(selectDeleteNotificationLoading);
    const fetchErrorMessage = useSelector(selectFetchNotificationsErrorMessage);
    const updateErrorMessage = useSelector(selectUpdateNotificationErrorMessage);
    const deleteErrorMessage = useSelector(selectDeleteNotificationErrorMessage);
    const [page, setPage] = useState(1);
    const [expandedNotificationIds, setExpandedNotificationIds] = useState([]);
    const notificationCount = notifications.length;
    const hasNotifications = notificationCount > 0;
    const canLoadMore = notificationCount < totalNotifications;
    const isInitialLoading = fetchLoading && !hasFetchedNotifications && notificationCount === 0;
    const errorMessages = [
        fetchErrorMessage,
        deleteErrorMessage,
        updateErrorMessage,
    ].filter(Boolean);
    const panelStyle = {
        width: panelWidth,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'min(460px, calc(100dvh - 112px))',
        overflowY: 'auto',
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
    };
    const contentStyle = {padding: 0};
    const alertStyle = {
        marginBottom: 8,
        borderRadius: token.borderRadiusLG,
    };

    useEffect(() => {
        if (!enabled || (page === 1 && hasFetchedNotifications)) {
            return;
        }

        dispatch(fetchNotifications(page === 1 ? {} : {page}));
    }, [dispatch, enabled, hasFetchedNotifications, page]);

    useEffect(() => {
        const unreadNotifications = notifications.filter((notification) => !notification?.is_read);

        if (!enabled || unreadNotifications.length === 0) {
            return;
        }

        unreadNotifications.forEach((notification) => {
            dispatch(markNotificationAsRead(notification.id));
        });
    }, [dispatch, enabled, notifications]);

    const handleLoadMore = () => {
        if (canLoadMore) {
            setPage((currentPage) => currentPage + 1);
        }
    };

    const toggleExpandedNotification = (notificationId) => {
        setExpandedNotificationIds((currentIds) => (
            currentIds.includes(notificationId)
                ? currentIds.filter((id) => id !== notificationId)
                : [...currentIds, notificationId]
        ));
    };

    const renderNotification = (notification) => {
        const isRead = notification?.is_read;
        const isExpanded = expandedNotificationIds.includes(notification.id);
        const deviceName =
            notification?.device_name
            ?? notification?.device_code
            ?? t('common.notAvailable');
        const notificationTitle = t(`notifications.items.${notification?.kind}.title`, {
            defaultValue: notification?.title || notification?.message,
            device: deviceName,
        });
        const notificationMessage = notification?.message
            ? t(`notifications.items.${notification?.kind}.message`, {
                defaultValue: notification.message,
                device: deviceName,
            })
            : null;
        const showMessage = Boolean(
            notificationMessage && notificationMessage !== notificationTitle,
        );
        const canExpandMessage = Boolean(notificationMessage && notificationMessage.length > 90);
        const createdAtLabel = notification?.created_at
            ? dayjs(notification.created_at).fromNow()
            : t('common.notAvailable');

        return (
            <div
                key={notification.id}
                style={{
                    padding: '16px 14px',
                    borderBlockEnd: `1px solid ${token.colorBorderSecondary}`,
                    margin: 0,
                }}
            >
                <Flex
                    vertical
                    gap={8}
                    style={{
                        width: '100%',
                    }}
                >
                    <Flex align="start" justify="space-between" gap={10}>
                        <Flex align="start" gap={10} style={{flex: 1, minWidth: 0}}>
                            {!isRead ? (
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 999,
                                        background: token.colorPrimary,
                                        flexShrink: 0,
                                        marginTop: 8,
                                    }}
                                />
                            ) : null}
                            <Flex vertical gap={2} style={{flex: 1, minWidth: 0}}>
                                <Paragraph
                                    style={{
                                        marginBottom: 0,
                                        fontWeight: 600,
                                        fontSize: token.fontSize,
                                        lineHeight: 1.3,
                                        color: token.colorText,
                                    }}
                                    ellipsis={{rows: 2}}
                                >
                                    {notificationTitle}
                                </Paragraph>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: token.fontSizeSM,
                                        lineHeight: 1.25,
                                    }}
                                >
                                    {deviceName}
                                </Text>
                            </Flex>
                        </Flex>

                        <Button
                            type="text"
                            danger
                            size="small"
                            loading={deleteLoading}
                            icon={<CloseOutlined />}
                            onClick={() => dispatch(deleteNotification(notification.id))}
                            style={{
                                flexShrink: 0,
                                marginTop: -4,
                                color: token.colorTextTertiary,
                                width: 24,
                                height: 24,
                                padding: 0,
                            }}
                        />
                    </Flex>

                    <Space orientation="vertical" size={2}>
                        {showMessage ? (
                            <Paragraph
                                type="secondary"
                                style={{
                                    marginBottom: 0,
                                    fontSize: token.fontSizeSM,
                                    lineHeight: 1.55,
                                    color: token.colorTextSecondary,
                                }}
                                ellipsis={isExpanded ? false : {rows: 2}}
                            >
                                {notificationMessage}
                            </Paragraph>
                        ) : null}
                        {showMessage && canExpandMessage ? (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => toggleExpandedNotification(notification.id)}
                                style={{
                                    height: 'auto',
                                    padding: 0,
                                    fontSize: Math.max(10, token.fontSizeSM - 1),
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {isExpanded ? t('notifications.readLess') : t('notifications.readMore')}
                            </Button>
                        ) : null}
                    </Space>

                    <Space orientation="vertical" size={4} style={{paddingTop: 1}}>
                        <Text type="secondary" style={{fontSize: token.fontSizeSM}}>
                            {createdAtLabel}
                        </Text>
                    </Space>
                </Flex>
            </div>
        );
    };

    if (isInitialLoading) {
        return (
            <Flex
                vertical
                style={panelStyle}
            >
                <Flex align="center" justify="center" style={{minHeight: 220, padding: '40px 0'}}>
                    <Spin size="large" />
                </Flex>
            </Flex>
        );
    }
    return (
        <Flex vertical style={panelStyle}>
            <Flex vertical gap={0} style={contentStyle}>
                {errorMessages.map((message, index) => (
                    <AntAlert
                        key={`notification-error-${index}`}
                        type="error"
                        showIcon
                        title={message}
                        style={alertStyle}
                    />
                ))}
                {!hasNotifications ? (
                    <Flex justify="center" style={{padding: '28px 8px 20px'}}>
                        <Empty description={t('notifications.empty')} />
                    </Flex>
                ) : (
                    <div style={{background: 'transparent', margin: 0}}>
                        {notifications.map(renderNotification)}
                    </div>
                )}
                {canLoadMore ? (
                    <Flex justify="center" style={{paddingTop: 4}}>
                        <Button onClick={handleLoadMore} loading={fetchLoading}>
                            {t('notifications.loadMore')}
                        </Button>
                    </Flex>
                ) : null}
            </Flex>
        </Flex>
    );
}

export default Notifications;
