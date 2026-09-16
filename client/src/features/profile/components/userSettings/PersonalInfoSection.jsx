import {Alert, Button, Form, Input, Space, Typography} from 'antd';
import {UserOutlined} from '@ant-design/icons';
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

export default function PersonalInfoSection({sectionGap}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const user = useSelector(selectCurrentUser);
    const loading = useSelector(selectUpdateUserLoading);
    const error = useSelector(selectUpdateUserErrorMessage);

    const handleSave = async ({firstName, lastName}) => {
        await dispatch(
            updateUser({
                data: {
                    first_name: firstName || '',
                    last_name: lastName || '',
                },
            })
        ).unwrap();

        AppAlert.show({type: 'success', message: t('account.messages.profileUpdated')});
    };

    return (
        <Space orientation="vertical" size={sectionGap} style={{width: '100%'}}>
            <div>
                <Title level={5} style={{marginTop: 0, marginBottom: 4}}>{t('account.personalInfoTitle')}</Title>
                <Paragraph type="secondary" style={{marginBottom: 0}}>
                    {t('account.personalInfoDescription')}
                </Paragraph>
            </div>
            <Form
                form={form}
                key={`profile-${user?.id ?? 'guest'}`}
                layout="vertical"
                initialValues={{
                    firstName: user?.first_name || '',
                    lastName: user?.last_name || '',
                }}
                onFinish={handleSave}
                disabled={loading}
            >
                {error ? <Alert type="error" message={error} /> : null}
                <Form.Item
                    label={t('account.firstNameLabel')}
                    name="firstName"
                    rules={[{required: true, message: t('account.validationFirstNameRequired')}]}
                >
                    <Input prefix={<UserOutlined />} placeholder={t('account.firstNamePlaceholder')} maxLength={50} />
                </Form.Item>
                <Form.Item
                    label={t('account.lastNameLabel')}
                    name="lastName"
                    rules={[{required: true, message: t('account.validationLastNameRequired')}]}
                >
                    <Input prefix={<UserOutlined />} placeholder={t('account.lastNamePlaceholder')} maxLength={50} />
                </Form.Item>
                <Form.Item shouldUpdate>
                    {() => {
                        const {firstName = '', lastName = ''} = form.getFieldsValue();
                        const hasChanges = (
                            firstName.trim() !== (user?.first_name || '')
                            || lastName.trim() !== (user?.last_name || '')
                        );
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
