import {useEffect} from 'react';
import {Button, Form, Input} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {loginUser} from '../store/authSlice';
import AuthFooterLink from './AuthFooterLink';
import {
    selectLoginLoading,
} from '../store/authSelectors';

const DEMO_LOGIN = {
    email: 'demo@example.com',
    password: 'demo1234',
};

const LoginForm = ({isActive, onToggleMode}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const loading = useSelector(selectLoginLoading);
    const [form] = Form.useForm();

    useEffect(() => {
        if (!isActive) {
            form.resetFields();
        }
    }, [form, isActive]);

    const handleSubmit = ({email, password}) => {
        dispatch(loginUser({user: {email, password}}));
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={DEMO_LOGIN}
            onFinish={handleSubmit}
        >
            <Form.Item
                label={t('auth.emailLabel')}
                name="email"
                rules={[
                    {required: true, message: t('auth.validationEmailRequired')},
                    {type: 'email', message: t('auth.validationEmailInvalid')},
                ]}
            >
                <Input placeholder={t('auth.emailPlaceholder')} />
            </Form.Item>

            <Form.Item
                label={t('auth.passwordLabel')}
                name="password"
                rules={[{required: true, message: t('auth.validationPasswordRequired')}]}
            >
                <Input.Password placeholder={t('auth.passwordPlaceholder')} />
            </Form.Item>

            <Form.Item style={{marginBottom: 0, textAlign: 'center'}}>
                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{minWidth: 132}}
                    loading={loading}
                >
                    {t('auth.loginAction')}
                </Button>
            </Form.Item>

            <AuthFooterLink
                prompt={t('auth.dontHaveAccount')}
                actionLabel={t('auth.registerAction')}
                onClick={onToggleMode}
            />
        </Form>
    );
};

export default LoginForm;
