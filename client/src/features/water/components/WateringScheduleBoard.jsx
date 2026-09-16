import {useState} from 'react';
import {
    App,
    Button,
    Collapse,
    Dropdown,
    Empty,
    Flex,
    Form,
    Modal,
    Space,
    Tag,
    TimePicker,
    theme,
    Typography,
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {
    createWateringSchedule,
    deleteWateringSchedule,
    updateWateringSchedule,
} from '../store/wateringSchedulesSlice';
import {
    getWateringDayLabel,
    normalizeWateringSchedule,
    parseScheduleTime,
    WATERING_DAY_ORDER,
} from '../utils/wateringUtils';
import Alert from '../../../shared/components/Alert.jsx';
import {getApiSuccessMessage} from '../../../shared/api/apiMessages.js';

const normalizeTimeForApi = (value) => parseScheduleTime(value).format('HH:mm');

export default function WateringScheduleBoard({selectedDevice}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const dispatch = useDispatch();
    const {modal} = App.useApp();
    const [form] = Form.useForm();
    const [modalDay, setModalDay] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const events = (selectedDevice?.wateringSchedules || []).map(normalizeWateringSchedule);
    const scheduleItems = WATERING_DAY_ORDER.map((day) => {
        const dayEvents = events
            .filter((event) => event.day === day)
            .sort((first, second) => parseScheduleTime(first.start).valueOf() - parseScheduleTime(second.start).valueOf());
        const activeEventsCount = dayEvents.filter((event) => event.status === 'active').length;
        const inactiveEventsCount = dayEvents.length - activeEventsCount;

        return {
            key: day,
            label: (
                <Space size={12} wrap>
                    <Typography.Text strong style={{display: 'inline-block', width: 88}}>
                        {getWateringDayLabel(t, day)}
                    </Typography.Text>
                    <Tag color="green">{`${t('watering.board.activeTag')}: ${activeEventsCount}`}</Tag>
                    <Tag>{`${t('watering.board.inactiveTag')}: ${inactiveEventsCount}`}</Tag>
                </Space>
            ),
            extra: <Button type="text" icon={<PlusOutlined />} onClick={(event) => { event.stopPropagation(); setModalDay(day); }}>{t('watering.addAction')}</Button>,
            children: dayEvents.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('watering.board.noEventsScheduled')} /> : (
                <Flex vertical>
                    {dayEvents.map((event, index) => (
                        <Flex
                            key={event.id}
                            align="center"
                            justify="space-between"
                            gap={12}
                            style={{
                                padding: '12px 0',
                                borderBottom: index < dayEvents.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                            }}
                        >
                            <Space size={10} wrap>
                                <Typography.Text strong>{event.startLabel || event.start} - {event.finishLabel || event.finish}</Typography.Text>
                                <Tag color={event.status === 'active' ? 'green' : 'default'}>{t(event.status === 'active' ? 'watering.board.activeTag' : 'watering.board.inactiveTag')}</Tag>
                            </Space>
                            <Dropdown
                                trigger={['click']}
                                classNames={{root: 'watering-event-actions-dropdown'}}
                                menu={{
                                    items: [
                                        {key: 'edit', label: t('watering.board.editEvent'), icon: <EditOutlined />},
                                        {
                                            key: 'toggle-status',
                                            label: t(event.status === 'active' ? 'watering.board.markInactive' : 'watering.board.markActive'),
                                            icon: event.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />,
                                        },
                                        {key: 'delete', label: t('common.delete'), danger: true, icon: <DeleteOutlined />},
                                    ],
                                    onClick: ({key}) => {
                                        if (key === 'edit') {
                                            setModalDay(event.day);
                                            setEditingEvent(event);
                                            form.setFieldsValue({start: parseScheduleTime(event.start), finish: parseScheduleTime(event.finish)});
                                            return;
                                        }

                                        if (key === 'toggle-status') {
                                            dispatch(updateWateringSchedule({
                                                scheduleId: event.id,
                                                active: event.status !== 'active',
                                            }))
                                                .unwrap()
                                                .then((payload) => {
                                                    Alert.show({
                                                        type: 'success',
                                                        message: getApiSuccessMessage(payload) || t('watering.messages.updateSuccess'),
                                                    });
                                                })
                                                .catch(() => null);
                                            return;
                                        }

                                        modal.confirm({
                                            title: t('watering.board.deleteEventTitle'),
                                            content: t('watering.board.deleteEventDescription'),
                                            okText: t('common.delete'),
                                            cancelText: t('common.cancel'),
                                            okButtonProps: {danger: true},
                                            onOk: async () => {
                                                try {
                                                    const payload = await dispatch(deleteWateringSchedule({scheduleId: event.id})).unwrap();
                                                    Alert.show({
                                                        type: 'success',
                                                        message: getApiSuccessMessage(payload) || t('common.delete'),
                                                    });
                                                } catch {
                                                    // API errors are displayed by the global axios interceptor.
                                                }
                                            },
                                        });
                                    },
                                }}
                            >
                                <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                        </Flex>
                    ))}
                </Flex>
            ),
        };
    });

    const closeModal = () => {
        setModalDay(null);
        setEditingEvent(null);
        form.resetFields();
    };

    const submitEventHandler = async () => {
        try {
            const values = await form.validateFields();

            if (!modalDay || !selectedDevice?.id) {
                return;
            }

            const day_of_week = (WATERING_DAY_ORDER.indexOf(modalDay) + 1) % 7;
            const start_time = normalizeTimeForApi(values.start.format('h:mm A'));
            const end_time = normalizeTimeForApi(values.finish.format('h:mm A'));

            if (editingEvent) {
                const payload = await dispatch(updateWateringSchedule({
                    scheduleId: editingEvent.id,
                    day_of_week,
                    start_time,
                    end_time,
                })).unwrap();

                Alert.show({
                    type: 'success',
                    message: getApiSuccessMessage(payload) || t('watering.messages.updateSuccess'),
                });
            } else {
                const payload = await dispatch(createWateringSchedule({
                    data: {
                        day_of_week,
                        start_time,
                        end_time,
                        active: true,
                    },
                })).unwrap();

                Alert.show({
                    type: 'success',
                    message: getApiSuccessMessage(payload) || t('watering.messages.createSuccess'),
                });
            }

            closeModal();
        } catch {
            // Form validation is shown inline.
        }
    };

    return (
        <>
            <Collapse
                items={scheduleItems}
                defaultActiveKey={WATERING_DAY_ORDER.slice(0, 2)}
                style={{background: 'transparent'}}
            />

            <Modal
                title={modalDay
                    ? editingEvent
                        ? t('watering.board.editEventForDay', {day: getWateringDayLabel(t, modalDay)})
                        : t('watering.board.addEventForDay', {day: getWateringDayLabel(t, modalDay)})
                    : t('watering.board.addWateringEvent')}
                open={modalDay !== null}
                onCancel={closeModal}
                onOk={submitEventHandler}
                mask={{closable: false}}
                okText={editingEvent ? t('watering.board.updateEvent') : t('watering.board.saveEvent')}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item
                        label={t('watering.startTimeLabel')}
                        name="start"
                        rules={[{required: true, message: t('watering.board.chooseStartTime')}]}
                    >
                        <TimePicker use12Hours format="h:mm A" style={{width: '100%'}} />
                    </Form.Item>

                    <Form.Item
                        label={t('watering.finishTimeLabel')}
                        name="finish"
                        dependencies={['start']}
                        rules={[
                            {required: true, message: t('watering.board.chooseFinishTime')},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    const startValue = getFieldValue('start');

                                    if (!value || !startValue || value.isAfter(startValue)) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error(t('watering.board.finishLaterError')));
                                },
                            }),
                        ]}
                    >
                        <TimePicker use12Hours format="h:mm A" style={{width: '100%'}} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
