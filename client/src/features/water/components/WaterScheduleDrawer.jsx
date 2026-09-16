import {
    Drawer,
    Row,
    Col,
    Grid,
    Space,
    Statistic,
    Tabs,
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import WateringScheduleBoard from './WateringScheduleBoard.jsx';
import WateringLogsList from './WateringLogsList.jsx';
import {
    formatRuntimeLabel,
    getWateringScheduleStats,
    normalizeWateringSchedule,
} from '../utils/wateringUtils';

export default function WaterScheduleDrawer({open, onClose, selectedDevice}) {
    const {t} = useTranslation();
    const {lg: isDesktop} = Grid.useBreakpoint();
    const events = (selectedDevice?.wateringSchedules || []).map(normalizeWateringSchedule);
    const {
        orderedEvents,
        scheduledDays,
        weeklyRuntime,
    } = getWateringScheduleStats(events);

    return (
        <Drawer
            title={t('watering.drawer.title')}
            placement="right"
            size={isDesktop ? 720 : 'large'}
            open={open}
            onClose={onClose}
            styles={{body: {paddingTop: 8}}}
            destroyOnHidden
        >
            <Space orientation="vertical" size={20} style={{width: '100%'}}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={t('watering.drawer.configuredEvents')}
                            value={orderedEvents.length}
                            prefix={<CalendarOutlined />}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={t('watering.drawer.scheduledDays')}
                            value={scheduledDays}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title={t('watering.drawer.weeklyRuntime')}
                            value={formatRuntimeLabel(weeklyRuntime, t)}
                            prefix={<ThunderboltOutlined />}
                        />
                    </Col>
                </Row>

                <Tabs
                    items={[
                        {
                            key: 'planner',
                            label: t('watering.drawer.plannerTab'),
                            children: <WateringScheduleBoard selectedDevice={selectedDevice} />,
                        },
                        {
                            key: 'logs',
                            label: t('watering.drawer.wateringLogsTab'),
                            children: (
                                <WateringLogsList
                                    enabled={open}
                                    selectedDevice={selectedDevice}
                                />
                            ),
                        },
                    ]}
                />
            </Space>
        </Drawer>
    );
}
