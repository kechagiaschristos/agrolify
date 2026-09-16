import {Alert, Button, Form, Input, Space, Typography} from 'antd';
import {LockOutlined} from '@ant-design/icons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {updateUser} from '../../store/userSlice';
import AppAlert from '../../../../shared/components/Alert.jsx';
import {
    selectUpdateUserErrorMessage,
    selectUpdateUserLoading,
} from '../../store/userSelectors';

const {Paragraph, Title} = Typography;

export default function PasswordSection({sectionGap}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const loading = useSelector(selectUpdateUserLoading);
    const error = useSelector(selectUpdateUserErrorMessage);

    const handleSave = async ({password}) => {
        await dispatch(updateUser({data: {password}})).unwrap();
        form.resetFields();
        AppAlert.show({type: 'success', message: t('account.messages.passwordUpdated')});
    };

    return (
        <Space orientation="vertical" size={sectionGap} style={{width: '100%'}}>
            <div>
                <Title level={5} style={{marginTop: 0, marginBottom: 4}}>{t('account.passwordTitle')}</Title>
                <Paragraph type="secondary" style={{marginBottom: 0}}>
                    {t('account.passwordDescription')}
                </Paragraph>
            </div>
            <Form
                form={form}
                key={`password-${loading ? 'saving' : 'idle'}`}
                name="profile-password-form"
                layout="vertical"
                onFinish={handleSave}
                disabled={loading}
                autoComplete="off"
            >
                {error ? <Alert type="error" message={error} /> : null}
                <Form.Item
                    label={t('account.newPasswordLabel')}
                    name="password"
                    rules={[
                        {required: true, message: t('account.validationPasswordRequired')},
                        {min: 6, message: t('account.validationPasswordMin')},
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder={t('auth.newPasswordPlaceholder')}
                        autoComplete="new-password"
                        name="profile_new_password"
                    />
                </Form.Item>
                <Form.Item
                    label={t('account.confirmPasswordLabel')}
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                        {required: true, message: t('account.validationConfirmPassword')},
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('auth.passwordsDoNotMatch')));
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder={t('auth.confirmNewPasswordPlaceholder')}
                        autoComplete="new-password"
                        name="profile_confirm_password"
                    />
                </Form.Item>
                <Form.Item shouldUpdate>
                    {() => {
                        const password = form.getFieldValue('password') || '';
                        const confirmPassword = form.getFieldValue('confirmPassword') || '';
                        const hasChanges = Boolean(password || confirmPassword);
                        const hasErrors = form.getFieldsError().some(({errors}) => errors.length);
                        const canSubmit = hasChanges && password.length >= 6 && password === confirmPassword;

                        return (
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                disabled={!canSubmit || hasErrors}
                            >
                                {t('common.save')}
                            </Button>
                        );
                    }}
                </Form.Item>
            </Form>
        </Space>
    );
}
