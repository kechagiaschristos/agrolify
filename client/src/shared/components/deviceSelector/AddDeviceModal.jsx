import {InfoCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Flex, Form, Grid, Input, Modal, Space, Tooltip} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {attachDevice} from '../../../features/devices/store/devicesSlice.js';
import {selectAttachDeviceLoading} from '../../../features/devices/store/devicesSelectors.js';
import Alert from '../Alert.jsx';
import {getApiSuccessMessage} from '../../api/apiMessages.js';

function AddDeviceModal({modal, closeModal, onDeviceAdded}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const attachDeviceLoading = useSelector(selectAttachDeviceLoading);
    const {md} = Grid.useBreakpoint();
    const isMobile = !md;
    const [form] = Form.useForm();
    const controlSize = isMobile ? 'middle' : 'large';
    const controlStyle = isMobile ? {fontSize: 16} : undefined;

    const handleClose = () => {
        document.activeElement?.blur?.();
        form.resetFields();
        closeModal();
    };

    const submitNewDeviceHandler = async ({deviceCode: nextDeviceCode}) => {
        try {
            const trimmedDeviceCode = nextDeviceCode.trim();
            const payload = await dispatch(attachDevice({deviceCode: trimmedDeviceCode})).unwrap();
            Alert.show({
                type: 'success',
                message: getApiSuccessMessage(payload) || t('deviceSettings.saveSuccess'),
            });
            await onDeviceAdded?.(trimmedDeviceCode);
            handleClose();
        } catch {
            // API errors are displayed by the global axios interceptor.
        }
    };

    return (
        <Modal
            open={modal}
            onCancel={handleClose}
            title={t('deviceModal.title')}
            destroyOnHidden
            centered
            width={isMobile ? 'min(320px, calc(100vw - 40px))' : 420}
            styles={{
                body: {
                    paddingTop: isMobile ? 8 : undefined,
                    paddingBottom: isMobile ? 18 : undefined,
                },
                footer: {
                    paddingTop: isMobile ? 8 : undefined,
                },
            }}
            footer={(
                <Flex vertical={isMobile} justify="flex-end" gap={8}>
                    <Button key="cancel" onClick={handleClose} block={isMobile}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        key="submit"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => form.submit()}
                        loading={attachDeviceLoading}
                        block={isMobile}
                    >
                        {t('deviceModal.addDeviceAction')}
                    </Button>
                </Flex>
            )}
        >
            <Space orientation="vertical" size={isMobile ? 16 : 20} style={{display: 'flex'}}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={submitNewDeviceHandler}
                    autoComplete="off"
                >
                    <Form.Item
                        label={(
                            <Space size={6}>
                                <span>{t('deviceModal.addDeviceLabel')}</span>
                                <Tooltip
                                    title={t('deviceModal.addDeviceTooltip')}
                                    placement="right"
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
                    >
                        <Input
                            size={controlSize}
                            placeholder={t('deviceModal.addDevicePlaceholder')}
                            maxLength={64}
                            allowClear
                            style={controlStyle}
                        />
                    </Form.Item>
                </Form>
            </Space>
        </Modal>
    );
}

export default AddDeviceModal;
