import {useState} from 'react';
import {DeploymentUnitOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Flex, Grid, Select, Space, Typography, theme} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import AddDeviceModal from '../../../shared/components/deviceSelector/AddDeviceModal.jsx';
import DashboardMetricCard from '../components/DashboardMetricCard.jsx';
import DashboardWeatherCard from '../components/weatherCard';
import IrrigationControlCard from '../components/controlCards/IrrigationControlCard.jsx';
import VentilationControlCard from '../components/controlCards/VentilationControlCard.jsx';
import WindowVentilationControlCard from '../components/controlCards/WindowVentilationControlCard.jsx';
import WaterTankStatusCard from '../components/controlCards/WaterTankStatusCard.jsx';
import WaterScheduleDrawer from '../../water/components/WaterScheduleDrawer.jsx';
import routePaths from '../../../app/router/routePaths.json';
import appThemeConfig from '../../../shared/theme/appThemeConfig';
import {
    getDeviceCode,
    selectFetchDevicesLoading,
    selectDevicesList,
    selectSelectedDeviceDetails,
} from '../../devices/store/devicesSelectors';
import {selectDevice} from '../../devices/store/devicesSlice.js';
import {selectFetchLatestMeasurementLoading, selectLatestMeasurements} from '../../measurements/store/measurementsSelectors';
import {selectFetchWateringSchedulesLoading} from '../../water/store/wateringSchedulesSelectors.js';
import {selectFetchFansLoading} from '../../air/store/fansSelectors.js';
import {selectFetchWindowLoading} from '../../water/store/windowsSelectors.js';
import {buildDashboardData} from '../utils/dashboardDataBuilder.js';

const getSelectedDeviceMeasurements = (latestMeasurements, selectedDeviceId) => {
    if (!selectedDeviceId) {
        return latestMeasurements;
    }

    return latestMeasurements.filter(
        (measurement) => String(measurement?.device_id ?? null) === String(selectedDeviceId),
    );
};

function DashboardEmptyState({devices, isMobile, t}) {
    const {token} = theme.useToken();
    const dispatch = useDispatch();
    const [addDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
    const hasDevices = devices.length > 0;
    const compactControlWidth = 'min(100%, 320px)';

    const handleDeviceSelect = async (deviceCode) => {
        if (!deviceCode) {
            return;
        }

        await dispatch(selectDevice(deviceCode)).catch(() => null);
    };

    const handleDeviceAdded = async (deviceCode) => {
        if (!deviceCode) {
            return;
        }

        await handleDeviceSelect(deviceCode);
    };

    return (
        <>
            <Flex
                align="center"
                justify="center"
                style={{
                    width: '100%',
                    minHeight: 'min(640px, 100%)',
                    flex: 1,
                    padding: isMobile ? '24px 0' : '48px 0',
                }}
            >
                <Flex
                    vertical
                    align="center"
                    gap={22}
                    style={{
                        width: '100%',
                        maxWidth: 620,
                        textAlign: 'center',
                        padding: isMobile ? '0 4px' : 0,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 18,
                            display: 'grid',
                            placeItems: 'center',
                            background: token.colorFillSecondary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            color: token.colorPrimary,
                            fontSize: token.fontSizeHeading1,
                        }}
                    >
                        <DeploymentUnitOutlined />
                    </div>

                    <Space orientation="vertical" size={8} style={{width: '100%'}}>
                        <Typography.Title
                            level={2}
                            style={{
                                margin: 0,
                                letterSpacing: 0,
                                lineHeight: 1.2,
                            }}
                        >
                            {t('dashboard.emptyState.title')}
                        </Typography.Title>
                        <Typography.Paragraph
                            type="secondary"
                            style={{
                                margin: 0,
                                fontSize: token.fontSizeLG,
                                lineHeight: 1.55,
                            }}
                        >
                            {t('dashboard.emptyState.description')}
                        </Typography.Paragraph>
                    </Space>

                    <Flex
                        vertical={isMobile}
                        align="center"
                        justify="center"
                        gap={12}
                        wrap={isMobile ? 'nowrap' : 'wrap'}
                        style={{
                            width: '100%',
                            maxWidth: isMobile ? 320 : '100%',
                        }}
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => setAddDeviceModalOpen(true)}
                            style={{
                                width: isMobile ? compactControlWidth : undefined,
                            }}
                        >
                            {t('dashboard.emptyState.addAction')}
                        </Button>

                        <Select
                            size="large"
                            disabled={!hasDevices}
                            placeholder={hasDevices
                                ? t('dashboard.emptyState.selectPlaceholder')
                                : t('dashboard.emptyState.noDevicesPlaceholder')}
                            onChange={handleDeviceSelect}
                            classNames={{popup: {root: 'device-selector-dropdown'}}}
                            popupMatchSelectWidth={false}
                            style={{
                                width: isMobile ? compactControlWidth : 260,
                                maxWidth: '100%',
                                textAlign: 'start',
                            }}
                            options={devices.map((device) => ({
                                value: getDeviceCode(device),
                                label: device.name?.trim() || getDeviceCode(device),
                            }))}
                        />
                    </Flex>
                </Flex>
            </Flex>

            <AddDeviceModal
                modal={addDeviceModalOpen}
                closeModal={() => setAddDeviceModalOpen(false)}
                onDeviceAdded={handleDeviceAdded}
            />
        </>
    );
}

const Dashboard = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
    const {md, xl, xxl} = Grid.useBreakpoint();
    const useWideDashboard = Boolean(xxl);
    const rowGap = appThemeConfig.card.spacing.rowGap;
    const metricGridColumns = xl ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))';
    const mainSectionColumns = useWideDashboard ? 'minmax(0, 1.65fr) minmax(min(100%, 620px), 1fr)' : '1fr';
    const topControlGridColumns = md ? 'repeat(2, minmax(0, 1fr))' : '1fr';
    const bottomControlGridColumns = md ? topControlGridColumns : '1fr';
    const compactControlCardHeight = 184;
    const topControlSectionHeight = 316;
    const weatherCardHeight = topControlSectionHeight + rowGap + compactControlCardHeight;
    const devicesList = useSelector(selectDevicesList);
    const loadingSelectedDevice = useSelector(selectFetchDevicesLoading);
    const loadingLatestMeasurement = useSelector(selectFetchLatestMeasurementLoading);
    const loadingWateringSchedules = useSelector(selectFetchWateringSchedulesLoading);
    const loadingFans = useSelector(selectFetchFansLoading);
    const loadingWindow = useSelector(selectFetchWindowLoading);
    const selectedDevice = useSelector(selectSelectedDeviceDetails);
    const latestMeasurements = useSelector(selectLatestMeasurements);
    const selectedDeviceMeasurements = getSelectedDeviceMeasurements(latestMeasurements, selectedDevice?.id);
    const latestMeasurement = selectedDeviceMeasurements[0] ?? null;
    const loadingDeviceData = loadingSelectedDevice && !selectedDevice;
    const loadingMeasurementData = loadingLatestMeasurement || loadingDeviceData;
    const loadingIrrigationData = loadingDeviceData || loadingWateringSchedules;
    const loadingFanData = loadingDeviceData || loadingFans;
    const loadingWindowData = loadingDeviceData || loadingWindow;
    const dashboardData = selectedDevice || loadingDeviceData
        ? buildDashboardData({
            selectedDevice: selectedDevice ?? {},
            latestMeasurement,
            latestMeasurements: selectedDeviceMeasurements,
            t,
        })
        : null;

    if (!dashboardData || (!selectedDevice && !loadingDeviceData)) {
        return (
            <DashboardEmptyState
                devices={devicesList}
                isMobile={!md}
                t={t}
            />
        );
    }

    return (
        <>
            <Flex
                vertical
                gap={rowGap}
                style={{
                    width: '100%',
                    height: useWideDashboard ? '100%' : 'auto',
                    minHeight: 0,
                    flex: 1,
                }}
            >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: metricGridColumns,
                    gap: rowGap,
                    width: '100%',
                    flex: '0 0 auto',
                    minWidth: 0,
                }}
            >
                {dashboardData.metricCards.map((metric) => (
                    <div key={metric.key} style={{display: 'flex', width: '100%', minWidth: 0}}>
                        <DashboardMetricCard
                            metric={metric}
                            loading={loadingMeasurementData}
                            onOpenHistory={navigate}
                        />
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: mainSectionColumns,
                    gap: rowGap,
                    flex: useWideDashboard ? 1 : '0 0 auto',
                    minHeight: 0,
                    width: '100%',
                    minWidth: 0,
                    alignItems: useWideDashboard ? 'stretch' : 'start',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        minWidth: 0,
                        height: useWideDashboard ? '100%' : 'auto',
                        alignSelf: useWideDashboard ? 'start' : 'stretch',
                    }}
                >
                    <DashboardWeatherCard
                        loading={loadingDeviceData}
                        minHeight={useWideDashboard ? weatherCardHeight : 0}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        minHeight: useWideDashboard ? 0 : undefined,
                        minWidth: 0,
                        height: useWideDashboard ? '100%' : 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateRows: useWideDashboard ? 'auto minmax(0, 1fr)' : 'auto',
                            gap: rowGap,
                            width: '100%',
                            height: useWideDashboard ? '100%' : 'auto',
                            minHeight: useWideDashboard ? 0 : undefined,
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: topControlGridColumns,
                                gap: rowGap,
                                width: '100%',
                                minWidth: 0,
                                minHeight: useWideDashboard ? 316 : undefined,
                                alignItems: 'stretch',
                            }}
                        >
                            <div style={{display: 'flex', width: '100%', minHeight: useWideDashboard ? 0 : undefined, height: '100%'}}>
                                <IrrigationControlCard
                                    loading={loadingIrrigationData}
                                    onOpenPlanner={() => setIsScheduleDrawerOpen(true)}
                                    stacked
                                />
                            </div>

                            <div style={{display: 'flex', width: '100%', minHeight: useWideDashboard ? 0 : undefined, height: '100%'}}>
                                <WaterTankStatusCard
                                    loading={loadingMeasurementData}
                                    onOpenHistory={() => navigate(routePaths.water)}
                                    stacked
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: bottomControlGridColumns,
                                gridAutoRows: useWideDashboard && md ? '1fr' : (md ? compactControlCardHeight : 'auto'),
                                gap: rowGap,
                                alignItems: md ? 'stretch' : 'start',
                                width: '100%',
                                minHeight: useWideDashboard ? 0 : undefined,
                            }}
                        >
                            <div style={{display: 'flex', width: '100%', minHeight: 0, height: md ? '100%' : 'auto'}}>
                                <VentilationControlCard loading={loadingFanData} stacked />
                            </div>

                            <div style={{display: 'flex', width: '100%', minHeight: 0, height: md ? '100%' : 'auto'}}>
                                <WindowVentilationControlCard loading={loadingWindowData} stacked />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </Flex>

            <WaterScheduleDrawer
                open={isScheduleDrawerOpen}
                onClose={() => setIsScheduleDrawerOpen(false)}
                selectedDevice={selectedDevice}
            />
        </>
    );
};

export default Dashboard;
