import {useState} from 'react';
import {Avatar, Button, Card, Flex, Grid, Skeleton, Switch, theme, Typography} from 'antd';
import {PiFanBold} from 'react-icons/pi';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {updateFan} from '../../../air/store/fansSlice';
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

export default function VentilationControlCard({loading = false, stacked = false}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const compactStackedMobile = stacked && !md;
    const [submitting, setSubmitting] = useState(false);
    const cardPadding = compactStackedMobile ? 12 : dashboardCardStyles.padding;
    const stackGap = compactStackedMobile ? 12 : dashboardCardStyles.sectionGap;
    const headerContentGap = compactStackedMobile ? 8 : (stacked ? 10 : stackGap);
    const panelGap = dashboardCardStyles.sectionGap;
    const innerPanelGap = dashboardCardStyles.sectionGap;
    const innerPanelPadding = stacked ? '8px' : '14px';
    const buttonHeight = stacked ? 32 : dashboardCardStyles.buttonHeight;
    const data = {
        title: t('dashboardControls.ventilation.titleShort', {defaultValue: 'Fans'}),
        autoModeLabel: t('dashboardControls.ventilation.autoModeLabel'),
        manualModeLabel: t('dashboardControls.ventilation.manualModeLabel'),
        runningLabel: t('dashboardControls.ventilation.runningLabel'),
        pausedLabel: t('dashboardControls.ventilation.pausedLabel'),
        manualOnButtonLabel: t('dashboardControls.ventilation.manualOnButtonLabel'),
        manualOffButtonLabel: t('dashboardControls.ventilation.manualOffButtonLabel'),
    };
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDeviceDetails);

    const selectedDeviceKey = selectedDevice?.code ?? null;
    const selectedFan = selectedDevice?.fan;
    const commandPending = selectedFan?.command?.status === 'pending';
    const commandFailed = selectedFan?.command?.status === 'failed';
    const isVentilationAuto = (selectedFan?.mode ?? 'manual') === 'auto';
    const currentFanStatus = selectedFan?.status ?? 'off';
    const isVentilationRunning = currentFanStatus === 'on';
    const topStatusLabel = commandPending ? t('deviceCommand.pending')
        : commandFailed ? t('deviceCommand.failed') : isVentilationRunning ? data.runningLabel : data.pausedLabel;

    const submitFanUpdate = async (data) => {
        setSubmitting(true);

        try {
            await dispatch(updateFan({data})).unwrap();
        } catch {
            // API errors are displayed by the global axios interceptor.
        } finally {
            setSubmitting(false);
        }
    };

    const handleVentilationAutoChange = async (checked) => {
        if (!selectedDeviceKey || !selectedFan) {
            return;
        }

        await submitFanUpdate({
            mode: checked ? 'auto' : 'manual',
            status: currentFanStatus,
        });
    };

    const handleVentilationManualPowerToggle = async (status) => {
        if (!selectedDeviceKey || !selectedFan) {
            return;
        }

        await submitFanUpdate({
            mode: 'manual',
            status,
        });
    };

    return (
        <Card
            style={{
                ...getSiteCardShellStyle(token),
                ...(stacked && !compactStackedMobile ? {
                    flex: 1,
                    height: '100%',
                    minHeight: 184,
                    alignSelf: 'stretch',
                } : {}),
            }}
            styles={{
                body: {
                    padding: cardPadding,
                    height: compactStackedMobile ? 'auto' : '100%',
                },
            }}
        >
            <Flex
                vertical
                gap={headerContentGap}
                style={compactStackedMobile ? undefined : {height: '100%', minHeight: 0}}
            >
                <Flex justify="space-between" align="flex-start" gap={dashboardCardStyles.headerGap}>
                    <Flex align="flex-start" gap={dashboardCardStyles.headerGap} flex={1} style={{minWidth: 0}}>
                        <Avatar
                            size={stacked ? 34 : 40}
                            icon={(
                                <PiFanBold
                                    size={18}
                                    style={!loading && isVentilationRunning ? {
                                        animation: 'ventilationSpin 2.6s linear infinite',
                                        transformOrigin: 'center',
                                    } : undefined}
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
                    <Typography.Text
                        style={{
                            color: isVentilationRunning ? '#22c55e' : token.colorTextSecondary,
                            fontWeight: 700,
                            fontSize: token.fontSizeSM,
                            lineHeight: 1.2,
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {loading ? (
                            <SkeletonText width={58} height={14} />
                        ) : topStatusLabel}
                    </Typography.Text>
                </Flex>

                <Flex
                    vertical
                    gap={stackGap}
                    style={{
                        minHeight: 0,
                        ...(compactStackedMobile ? {} : {flex: 1}),
                        justifyContent: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: panelGap,
                            height: compactStackedMobile ? 'auto' : '100%',
                            minHeight: 0,
                        }}
                    >
                        <Flex
                            vertical
                            gap={innerPanelGap}
                            style={{
                                height: compactStackedMobile ? 'auto' : '100%',
                                padding: innerPanelPadding,
                                justifyContent: 'flex-start',
                                ...getCardNestedPanelStyle(token),
                            }}
                        >
                            <Flex
                                justify="space-between"
                                align="center"
                                gap={12}
                                style={{
                                    minHeight: 40,
                                    padding: '9px 12px',
                                    borderRadius: token.borderRadius,
                                    background: token.colorFillQuaternary,
                                }}
                            >
                                <Typography.Text
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontSize: token.fontSizeSM,
                                        lineHeight: 1.2,
                                        ...singleLineTextStyle,
                                    }}
                                >
                                    {loading ? (
                                        <SkeletonText width={86} height={12} />
                                    ) : (
                                        isVentilationAuto ? data.autoModeLabel : data.manualModeLabel
                                    )}
                                </Typography.Text>
                                {loading ? (
                                    <SkeletonText width={28} height={16} />
                                ) : (
                                    <Switch
                                        size="small"
                                        checked={isVentilationAuto}
                                        onChange={handleVentilationAutoChange}
                                        disabled={submitting || commandPending}
                                    />
                                )}
                            </Flex>

                            <Flex justify="flex-start" align="center" gap={8} style={{width: '100%', marginTop: 'auto'}}>
                                {loading ? (
                                    <SkeletonText block height={buttonHeight} radius={token.borderRadius} />
                                ) : (
                                    <Button
                                        block
                                        onClick={() => handleVentilationManualPowerToggle(isVentilationRunning ? 'off' : 'on')}
                                        disabled={isVentilationAuto || submitting || commandPending}
                                        loading={submitting || commandPending}
                                        style={{
                                            height: buttonHeight,
                                            ...singleLineTextStyle,
                                        }}
                                    >
                                        {isVentilationRunning ? data.manualOffButtonLabel : data.manualOnButtonLabel}
                                    </Button>
                                )}
                            </Flex>
                        </Flex>
                    </div>
                </Flex>
            </Flex>
        </Card>
    );
}
