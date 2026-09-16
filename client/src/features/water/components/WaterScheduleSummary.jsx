import {Button, Descriptions, Tag} from 'antd';
import {CalendarOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import {formatRuntimeLabel, getWateringScheduleStats, normalizeWateringSchedule} from '../utils/wateringUtils';
import appThemeConfig from '../../../shared/theme/appThemeConfig';

export default function WaterScheduleSummary({events, onOpenPlanner}) {
    const {t} = useTranslation();
    const normalizedEvents = (events || []).map(normalizeWateringSchedule);
    const {activeOrderedEvents, weeklyRuntime} = getWateringScheduleStats(normalizedEvents);

    return (
        <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 16}}>
            <Descriptions
                column={1}
                size="small"
                items={[
                    {
                        key: 'configured-events',
                        label: t('watering.summary.configuredEventsLabel'),
                        children: (
                            <Tag color="cyan">
                                {t('watering.summary.totalEvents', {count: activeOrderedEvents.length})}
                            </Tag>
                        ),
                    },
                    {
                        key: 'weekly-runtime',
                        label: t('watering.summary.weeklyRuntimeLabel'),
                        children: (
                            <Tag color="green">
                                {formatRuntimeLabel(weeklyRuntime, t)}
                            </Tag>
                        ),
                    },
                ]}
            />

            <Button
                block
                icon={<CalendarOutlined />}
                onClick={onOpenPlanner}
                style={{
                    height: appThemeConfig.card.spacing.buttonHeight,
                    marginTop: 'auto',
                }}
            >
                {t('watering.summary.openPlanner')}
            </Button>
        </div>
    );
}
