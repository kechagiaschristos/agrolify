import {Alert, Button, Form, Input, Modal, Space, Typography} from 'antd';
import {DeleteOutlined, WarningOutlined} from '@ant-design/icons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {deleteUser} from '../../store/userSlice';
import {
    selectDeleteUserErrorMessage,
    selectDeleteUserLoading,
} from '../../store/userSelectors';

const {Paragraph, Title} = Typography;

export default function DangerZoneSection({sectionGap}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const loading = useSelector(selectDeleteUserLoading);
    const error = useSelector(selectDeleteUserErrorMessage);

    const handleDeleteAccount = () => {
        Modal.confirm({
            title: t('account.deleteConfirmTitle'),
            icon: <WarningOutlined />,
            content: t('account.deleteConfirmContent'),
            okText: t('account.deleteConfirmButton'),
            okButtonProps: {danger: true, loading},
            cancelText: t('common.cancel'),
            centered: true,
            onOk: () => dispatch(deleteUser()),
        });
    };

    return (
        <Space orientation="vertical" size={sectionGap} style={{width: '100%'}}>
            <Alert
                type="error"
                message={t('account.deleteAlertTitle')}
                description={t('account.deleteAlertDescription')}
            />
            <div>
                <Title level={5} style={{marginTop: 0, marginBottom: 4}}>{t('account.deleteTitle')}</Title>
                <Paragraph type="secondary" style={{marginBottom: 0}}>
                    {t('account.deleteDescription', {value: 'DELETE'})}
                </Paragraph>
            </div>
            <Form
                form={form}
                name="profile-delete-form"
                layout="vertical"
                disabled={loading}
                onFinish={handleDeleteAccount}
                autoComplete="off"
            >
                {error ? <Alert type="error" message={error} /> : null}
                <Form.Item
                    label={t('account.deleteConfirmationLabel')}
                    name="confirmation"
                    rules={[
                        {required: true, message: t('account.validationDeleteRequired')},
                        {
                            validator(_, value) {
                                if (value === 'DELETE') {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('account.validationDeleteExact')));
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder={t('account.deleteConfirmationPlaceholder')}
                        autoComplete="off"
                        name="profile_delete_confirmation"
                    />
                </Form.Item>
                <Form.Item shouldUpdate>
                    {() => {
                        const confirmation = form.getFieldValue('confirmation') || '';
                        const hasErrors = form.getFieldsError().some(({errors}) => errors.length);

                        return (
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={loading}
                                htmlType="submit"
                                disabled={confirmation !== 'DELETE' || hasErrors}
                            >
                                {t('account.deleteAction')}
                            </Button>
                        );
                    }}
                </Form.Item>
            </Form>
        </Space>
    );
}
