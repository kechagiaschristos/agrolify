import {useEffect} from 'react';
import {Button, Form, Input} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {registerUser} from '../store/authSlice';
import AuthFooterLink from './AuthFooterLink';
import {
    selectRegisterLoading,
} from '../store/authSelectors';

const RegisterForm = ({isActive, onToggleMode}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const loading = useSelector(selectRegisterLoading);
    const [form] = Form.useForm();

    useEffect(() => {
        if (!isActive) {
            form.resetFields();
        }
    }, [form, isActive]);

    const handleSubmit = ({email, password, passwordConfirmation, firstName, lastName}) => {
        dispatch(registerUser({user: {
            email: email.trim(),
            password,
            password_confirmation: passwordConfirmation,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
        }}));
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                label={t('account.firstNameLabel')}
                name="firstName"
                rules={[
                    {required: true, whitespace: true, message: t('account.validationFirstNameRequired')},
                ]}
            >
                <Input placeholder={t('account.firstNamePlaceholder')} maxLength={50} />
            </Form.Item>

            <Form.Item
                label={t('account.lastNameLabel')}
                name="lastName"
                rules={[
                    {required: true, whitespace: true, message: t('account.validationLastNameRequired')},
                ]}
            >
                <Input placeholder={t('account.lastNamePlaceholder')} maxLength={50} />
            </Form.Item>

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
                rules={[
                    {required: true, message: t('auth.validationNewPasswordRequired')},
                    {min: 6, message: t('account.validationPasswordMin')},
                ]}
            >
                <Input.Password placeholder={t('auth.newPasswordPlaceholder')} />
            </Form.Item>

            <Form.Item
                label={t('auth.confirmPasswordLabel')}
                name="passwordConfirmation"
                dependencies={['password']}
                rules={[
                    {required: true, message: t('auth.validationConfirmPassword')},
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
                <Input.Password placeholder={t('auth.confirmNewPasswordPlaceholder')} />
            </Form.Item>

            <Form.Item style={{marginBottom: 0, textAlign: 'center'}}>
                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{minWidth: 132}}
                    loading={loading}
                >
                    {t('auth.registerAction')}
                </Button>
            </Form.Item>

            <AuthFooterLink
                prompt={t('auth.alreadyHaveAccount')}
                actionLabel={t('auth.loginAction')}
                onClick={onToggleMode}
            />
        </Form>
    );
};

export default RegisterForm;
