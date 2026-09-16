import {Alert, Button, Form, Input, Space, Typography} from 'antd';
import {MailOutlined} from '@ant-design/icons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {updateUser} from '../../store/userSlice';
import AppAlert from '../../../../shared/components/Alert.jsx';
import {
    selectCurrentUser,
    selectUpdateUserErrorMessage,
    selectUpdateUserLoading,
} from '../../store/userSelectors';

const {Paragraph, Title} = Typography;

export default function EmailSection({sectionGap}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const user = useSelector(selectCurrentUser);
    const loading = useSelector(selectUpdateUserLoading);
    const error = useSelector(selectUpdateUserErrorMessage);

    const handleSave = async ({email}) => {
        await dispatch(updateUser({data: {email}})).unwrap();
        AppAlert.show({type: 'success', message: t('account.messages.emailUpdated')});
    };

    return (
        <Space orientation="vertical" size={sectionGap} style={{width: '100%'}}>
            <div>
                <Title level={5} style={{marginTop: 0, marginBottom: 4}}>{t('account.emailTitle')}</Title>
                <Paragraph type="secondary" style={{marginBottom: 0}}>
                    {t('account.emailDescription')}
                </Paragraph>
            </div>
            <Form
                form={form}
                key={`email-${user?.id ?? 'guest'}`}
                name="profile-email-form"
                layout="vertical"
                initialValues={{email: user?.email || ''}}
                onFinish={handleSave}
                disabled={loading}
                autoComplete="off"
            >
                {error ? <Alert type="error" message={error} /> : null}
                <Form.Item
                    label={t('auth.emailLabel')}
                    name="email"
                    rules={[
                        {required: true, message: t('account.validationEmailRequired')},
                        {type: 'email', message: t('account.validationEmailInvalid')},
                    ]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder={t('auth.emailPlaceholder')}
                        autoComplete="email"
                        name="profile_email"
                    />
                </Form.Item>
                <Form.Item shouldUpdate>
                    {() => {
                        const email = (form.getFieldValue('email') || '').trim();
                        const hasChanges = email !== (user?.email || '');
                        const hasErrors = form.getFieldsError().some(({errors}) => errors.length);

                        return (
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                disabled={!hasChanges || hasErrors}
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
