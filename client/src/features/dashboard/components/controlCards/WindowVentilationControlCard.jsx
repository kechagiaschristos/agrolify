import {useCallback, useState} from 'react';
import {Avatar, Button, Card, Flex, Grid, Skeleton, theme, Typography} from 'antd';
import {LuBlinds} from 'react-icons/lu';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {updateWindow} from '../../../water/store/windowsSlice';
import appThemeConfig from '../../../../shared/theme/appThemeConfig';
import {selectSelectedDeviceDetails} from '../../../devices/store/devicesSelectors';

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

const getWindowStateMeta = (status) => {
    const isOpening = status === 'opening';
    const isClosing = status === 'closing';
    const isOpen = status === 'open';

    return {
        color: isOpening || isClosing ? '#b45309' : (isOpen ? '#166534' : '#6b7280'),
        dotColor: isOpening || isClosing ? '#f59e0b' : (isOpen ? '#22c55e' : '#9ca3af'),
        dotShadow: isOpening || isClosing
            ? '0 0 0 4px rgba(245, 158, 11, 0.16)'
            : (isOpen ? '0 0 0 4px rgba(34, 197, 94, 0.16)' : 'none'),
    };
};

const getWindowStatusLabel = (status, data) => (
    status === 'opening'
        ? data.openingLabel
        : (status === 'closing'
            ? data.closingLabel
            : (status === 'open' ? data.openedLabel : data.closedLabel))
);

export default function WindowVentilationControlCard({loading = false, stacked = false}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const isMobile = !md;
    const useWindowRowLayout = stacked;
    const [submitting, setSubmitting] = useState(false);
    const cardPadding = stacked && !md ? 12 : dashboardCardStyles.padding;
    const stackGap = stacked && !md ? 12 : dashboardCardStyles.sectionGap;
    const headerContentGap = stacked && !md ? 8 : (stacked ? 10 : stackGap);
    const windowPanelPadding = stacked ? '10px' : '14px';
    const windowPanelMinHeight = useWindowRowLayout ? 0 : 136;
    const buttonHeight = stacked ? 32 : dashboardCardStyles.buttonHeight;
    const data = {
        title: t('dashboardControls.windowVentilation.titleShort', {defaultValue: 'Windows'}),
        openedLabel: t('dashboardControls.windowVentilation.openedLabel'),
        closedLabel: t('dashboardControls.windowVentilation.closedLabel'),
        openingLabel: t('dashboardControls.windowVentilation.openingLabel'),
        closingLabel: t('dashboardControls.windowVentilation.closingLabel'),
        leftWindowLabel: t('dashboardControls.windowVentilation.leftWindowLabel'),
        rightWindowLabel: t('dashboardControls.windowVentilation.rightWindowLabel'),
        manualOpenButtonLabel: t('dashboardControls.windowVentilation.manualOpenButtonLabel'),
        manualCloseButtonLabel: t('dashboardControls.windowVentilation.manualCloseButtonLabel'),
    };
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDeviceDetails);

    const selectedDeviceKey = selectedDevice?.code ?? null;
    const selectedWindow = selectedDevice?.window;
    const commandPending = selectedWindow?.command?.status === 'pending';
    const commandFailed = selectedWindow?.command?.status === 'failed';
    const leftWindowStatus = selectedWindow?.left_window_status || 'closed';
    const rightWindowStatus = selectedWindow?.right_window_status || 'closed';
    const leftWindowMeta = getWindowStateMeta(leftWindowStatus);
    const rightWindowMeta = getWindowStateMeta(rightWindowStatus);
    const isWindowOpening = [leftWindowStatus, rightWindowStatus].includes('opening');
    const isWindowClosing = [leftWindowStatus, rightWindowStatus].includes('closing');
    const isWindowOpen = [leftWindowStatus, rightWindowStatus].includes('open');
    const currentStatusLabel = isWindowOpening
        ? data.openingLabel
        : (isWindowClosing ? data.closingLabel : (isWindowOpen ? data.openedLabel : data.closedLabel));

    const buildWindowPayload = useCallback((overrides = {}) => ({
        left_window_status: leftWindowStatus,
        right_window_status: rightWindowStatus,
        ...overrides,
    }), [leftWindowStatus, rightWindowStatus]);

    const submitWindowUpdate = useCallback(async (data) => {
        setSubmitting(true);

        try {
            await dispatch(updateWindow({data})).unwrap();
        } catch {
            // API errors are displayed by the global axios interceptor.
        } finally {
            setSubmitting(false);
        }
    }, [dispatch]);

    const syncWindowStatus = useCallback(async (status, window = 'both') => {
        if (!selectedDeviceKey) {
            return;
        }

        const nextWindowData = buildWindowPayload();

        if (window === 'both' || window === 'left') {
            nextWindowData.left_window_status = status;
        }

        if (window === 'both' || window === 'right') {
            nextWindowData.right_window_status = status;
        }

        await submitWindowUpdate(nextWindowData);
    }, [buildWindowPayload, selectedDeviceKey, submitWindowUpdate]);

    return (
        <Card
            style={{
                ...getSiteCardShellStyle(token),
                ...(stacked ? {flex: 1, height: '100%', minHeight: 184, alignSelf: 'stretch'} : {}),
            }}
            styles={{
                body: {
                    padding: cardPadding,
                    height: '100%',
                },
            }}
        >
            <Flex vertical gap={headerContentGap} style={{height: '100%', minHeight: 0}}>
                <Flex justify="space-between" align="flex-start" gap={dashboardCardStyles.headerGap}>
                    <Flex align="flex-start" gap={dashboardCardStyles.headerGap} flex={1} style={{minWidth: 0}}>
                        <Avatar
                            size={stacked ? 34 : 40}
                            icon={<LuBlinds size={18} />}
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
                    <Typography.Text
                        style={{
                            color: isWindowOpening || isWindowClosing
                                ? '#b45309'
                                : (isWindowOpen ? '#22c55e' : token.colorTextSecondary),
                            fontWeight: 700,
                            fontSize: token.fontSizeSM,
                            lineHeight: 1.2,
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {loading ? (
                            <SkeletonText width={58} height={14} />
                        ) : commandPending ? t('deviceCommand.pending') : commandFailed ? t('deviceCommand.failed') : currentStatusLabel}
                    </Typography.Text>
                </Flex>

                <Flex
                    vertical
                    gap={stackGap}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        justifyContent: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            minHeight: 0,
                            ...getCardNestedPanelStyle(token),
                        }}
                    >
                        {[
                            {
                                key: 'left',
                                label: data.leftWindowLabel,
                                meta: leftWindowMeta,
                                status: leftWindowStatus,
                            },
                            {
                                key: 'right',
                                label: data.rightWindowLabel,
                                meta: rightWindowMeta,
                                status: rightWindowStatus,
                            },
                        ].map((windowItem, index) => (
                            <Flex
                                key={windowItem.key}
                                vertical={!useWindowRowLayout}
                                gap={dashboardCardStyles.sectionGap}
                                align={useWindowRowLayout ? 'center' : undefined}
                                style={{
                                    padding: `${windowPanelPadding} ${windowPanelPadding}`,
                                    minWidth: 0,
                                    minHeight: windowPanelMinHeight,
                                    flex: 1,
                                    justifyContent: 'space-between',
                                    borderTop: index === 0 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <Flex
                                    vertical={useWindowRowLayout || !isMobile}
                                    justify={useWindowRowLayout ? 'center' : (isMobile ? 'space-between' : 'flex-start')}
                                    align={useWindowRowLayout ? 'flex-start' : (isMobile ? 'center' : 'flex-start')}
                                    gap={useWindowRowLayout ? 2 : (isMobile ? 8 : 6)}
                                    style={{minWidth: 0, flex: useWindowRowLayout ? 1 : undefined}}
                                >
                                    <Typography.Text
                                        strong
                                        style={{
                                            color: token.colorText,
                                            fontSize: stacked ? token.fontSizeSM : token.fontSize,
                                            lineHeight: 1.15,
                                            flex: isMobile ? '1 1 auto' : undefined,
                                            ...singleLineTextStyle,
                                        }}
                                    >
                                        {loading ? (
                                            <SkeletonText width={72} height={11} />
                                        ) : windowItem.label}
                                    </Typography.Text>
                                    <Typography.Text
                                        style={{
                                            maxWidth: '100%',
                                            color: windowItem.status === 'opening' || windowItem.status === 'closing'
                                                ? '#b45309'
                                                : (windowItem.status === 'open' ? '#22c55e' : token.colorTextSecondary),
                                            fontSize: stacked ? token.fontSizeSM - 1 : token.fontSizeSM,
                                            fontWeight: 700,
                                            lineHeight: 1.15,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {loading ? (
                                            <SkeletonText width={38} height={10} />
                                        ) : (
                                            getWindowStatusLabel(windowItem.status, data)
                                        )}
                                    </Typography.Text>
                                </Flex>

                                <Flex
                                    justify="flex-start"
                                    align="center"
                                    gap={8}
                                    style={useWindowRowLayout ? {width: 104, flexShrink: 0} : undefined}
                                >
                                    {loading ? (
                                        <SkeletonText block height={buttonHeight} radius={token.borderRadius} />
                                    ) : (
                                        <Button
                                            block
                                            onClick={() => syncWindowStatus(
                                                ['open', 'opening'].includes(windowItem.status) ? 'closed' : 'open',
                                                windowItem.key,
                                            )}
                                            disabled={submitting || commandPending}
                                            loading={submitting || commandPending}
                                            style={{
                                                height: buttonHeight,
                                                ...singleLineTextStyle,
                                            }}
                                        >
                                            {['open', 'opening'].includes(windowItem.status)
                                                ? data.manualCloseButtonLabel
                                                : data.manualOpenButtonLabel}
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>
                        ))}
                    </div>
                </Flex>
            </Flex>
        </Card>
    );
}
