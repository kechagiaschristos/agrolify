import {useEffect, useRef, useState} from 'react';
import {InfoCircleOutlined, PlusCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Divider, Flex, Form, Grid, Input, Modal, Select, Space, Tooltip, Typography} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import AddDeviceModal from './AddDeviceModal.jsx';
import {useTranslation} from 'react-i18next';
import {attachDevice, fetchDevices, selectDevice} from '../../../features/devices/store/devicesSlice.js';
import {
    findDeviceByCode,
    getDeviceCode,
    selectDevicesList,
    selectFetchDevicesErrorMessage,
    selectFetchDevicesLoading,
} from '../../../features/devices/store/devicesSelectors.js';
import {selectSelectedDeviceCode} from '../../../features/profile/store/userSelectors.js';
import Alert from '../Alert.jsx';
import {getApiSuccessMessage} from '../../api/apiMessages.js';

function DeviceSelector({compact = false, modalTrigger = false}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const {md} = Grid.useBreakpoint();
    const isMobile = !md;
    const [addDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
    const [selectorModalOpen, setSelectorModalOpen] = useState(false);
    const [addingDevice, setAddingDevice] = useState(false);
    const [addDeviceForm] = Form.useForm();
    const hasRequestedDevicesRef = useRef(false);
    const devices = useSelector(selectDevicesList);
    const fetchDevicesLoading = useSelector(selectFetchDevicesLoading);
    const fetchDevicesError = useSelector(selectFetchDevicesErrorMessage);
    const selectedDeviceCode = useSelector(selectSelectedDeviceCode);
    const selectedDevice = findDeviceByCode(devices, selectedDeviceCode);
    const selectorControlSize = isMobile ? 'middle' : 'large';
    const mobileControlStyle = isMobile ? {fontSize: 16} : undefined;

    useEffect(() => {
        if (!hasRequestedDevicesRef.current && devices.length === 0 && !fetchDevicesLoading) {
            hasRequestedDevicesRef.current = true;
            dispatch(fetchDevices());
        }
    }, [devices.length, dispatch, fetchDevicesLoading]);

    const handleDeviceSelect = async (deviceCode) => {
        await dispatch(selectDevice(deviceCode)).catch(() => null);

        if (modalTrigger) {
            setSelectorModalOpen(false);
        }
    };

    const handleDeviceAdded = async (deviceCode) => {
        if (deviceCode) {
            await handleDeviceSelect(deviceCode);
        }

        setAddDeviceModalOpen(false);
    };

    const handleInlineDeviceAdd = async ({deviceCode: nextDeviceCode}) => {
        setAddingDevice(true);

        try {
            const trimmedDeviceCode = nextDeviceCode.trim();
            const payload = await dispatch(attachDevice({deviceCode: trimmedDeviceCode})).unwrap();

            Alert.show({
                type: 'success',
                message: getApiSuccessMessage(payload) || t('deviceSettings.saveSuccess'),
            });

            addDeviceForm.resetFields();
            await handleDeviceSelect(trimmedDeviceCode);
        } catch {
            // API errors are displayed by the global axios interceptor.
        } finally {
            setAddingDevice(false);
        }
    };

    const handleSelectorModalClose = () => {
        document.activeElement?.blur?.();
        addDeviceForm.resetFields();
        setSelectorModalOpen(false);
    };

    if (modalTrigger) {
        return (
            <>
                <Button
                    type="text"
                    shape="circle"
                    size="large"
                    icon={<PlusCircleOutlined style={{fontSize: 16}} />}
                    onClick={() => setSelectorModalOpen(true)}
                    aria-label={t('deviceModal.title')}
                    style={{flexShrink: 0}}
                />

                <Modal
                    open={selectorModalOpen}
                    onCancel={handleSelectorModalClose}
                    title={t('deviceModal.title')}
                    footer={null}
                    destroyOnHidden
                    centered
                    width={isMobile ? 'min(320px, calc(100vw - 40px))' : 'min(360px, calc(100vw - 32px))'}
                    styles={{
                        body: {
                            paddingTop: isMobile ? 4 : 8,
                            paddingBottom: isMobile ? 18 : undefined,
                        },
                    }}
                >
                    <Flex vertical gap={isMobile ? 8 : 10}>
                        <Flex vertical gap={8}>
                            <Typography.Text strong>
                                {t('devices.selectPlaceholder')}
                            </Typography.Text>

                            <Select
                                size={selectorControlSize}
                                value={getDeviceCode(selectedDevice) ?? undefined}
                                placeholder={fetchDevicesError || t('devices.selectPlaceholder')}
                                onChange={handleDeviceSelect}
                                loading={fetchDevicesLoading}
                                disabled={fetchDevicesLoading}
                                status={fetchDevicesError ? 'error' : undefined}
                                classNames={{popup: {root: 'device-selector-dropdown'}}}
                                popupMatchSelectWidth={false}
                                style={{width: '100%', ...mobileControlStyle}}
                                options={devices.map((device) => ({
                                    value: getDeviceCode(device),
                                    label: device.name?.trim() || getDeviceCode(device),
                                }))}
                            />
                        </Flex>

                        <Divider plain style={{margin: isMobile ? '4px 0 0' : '8px 0 2px'}}>
                            {t('common.or')}
                        </Divider>

                        <Form
                            form={addDeviceForm}
                            layout="vertical"
                            onFinish={handleInlineDeviceAdd}
                            autoComplete="off"
                        >
                            <Form.Item
                                label={(
                                    <Space size={6}>
                                        <span>{t('deviceModal.addDeviceLabel')}</span>
                                        <Tooltip
                                            title={t('deviceModal.addDeviceTooltip')}
                                            placement="top"
                                        >
                                            <InfoCircleOutlined
                                                style={{
                                                    color: '#94a3b8',
                                                    fontSize: 14,
                                                    cursor: 'help',
                                                }}
                                            />
                                        </Tooltip>
                                    </Space>
                                )}
                                name="deviceCode"
                                rules={[
                                    {required: true, message: t('deviceModal.validationIdRequired')},
                                ]}
                                style={{marginBottom: isMobile ? 10 : 12}}
                            >
                                <Input
                                    size={selectorControlSize}
                                    placeholder={t('deviceModal.addDevicePlaceholder')}
                                    maxLength={64}
                                    allowClear
                                    style={mobileControlStyle}
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                size={selectorControlSize}
                                block
                                htmlType="submit"
                                icon={<PlusOutlined />}
                                loading={addingDevice}
                            >
                                {t('deviceModal.addDeviceAction')}
                            </Button>
                        </Form>
                    </Flex>
                </Modal>
            </>
        );
    }

    return (
        <>
            <Space.Compact>
                <Button
                    type="primary"
                    icon={<PlusOutlined style={{fontSize: 16}} />}
                    onClick={() => setAddDeviceModalOpen(true)}
                />
                <Select
                    value={getDeviceCode(selectedDevice) ?? undefined}
                    placeholder={fetchDevicesError || t('devices.selectPlaceholder')}
                    onChange={handleDeviceSelect}
                    loading={fetchDevicesLoading}
                    disabled={fetchDevicesLoading}
                    status={fetchDevicesError ? 'error' : undefined}
                    classNames={{popup: {root: 'device-selector-dropdown'}}}
                    popupMatchSelectWidth={false}
                    style={{
                        width: compact ? 140 : 220,
                        minWidth: compact ? 140 : 220,
                    }}
                    options={devices.map((device) => ({
                        value: getDeviceCode(device),
                        label: device.name?.trim() || getDeviceCode(device),
                    }))}
                />
            </Space.Compact>

            <AddDeviceModal
                modal={addDeviceModalOpen}
                closeModal={() => setAddDeviceModalOpen(false)}
                onDeviceAdded={handleDeviceAdded}
            />
        </>
    );
}

export default DeviceSelector;
