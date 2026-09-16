import {Grid} from 'antd';
import {useLocation, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import routePaths from '../../../app/router/routePaths.json';
import PublicHeader from '../../../shared/layout/PublicHeader.jsx';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const {useBreakpoint} = Grid;

const AUTH_MODE = {
    login: 'login',
    register: 'register',
};

const getAuthModeFromPath = (pathname) => (
    pathname === routePaths.register ? AUTH_MODE.register : AUTH_MODE.login
);

const AuthPage = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const mode = getAuthModeFromPath(location.pathname);

    const handleModeToggle = (targetMode) => {
        if (targetMode === mode) {
            return;
        }

        navigate(targetMode === AUTH_MODE.register ? routePaths.register : routePaths.login, {state: location.state});
    };

    return (
        <AuthLayout
            activeMode={mode}
            header={<PublicHeader />}
            isMobile={!screens.lg}
            loginForm={(
                <LoginForm
                    isActive={mode === AUTH_MODE.login}
                    onToggleMode={() => handleModeToggle(AUTH_MODE.register)}
                />
            )}
            loginTitle={t('auth.loginTitle')}
            registerForm={(
                <RegisterForm
                    isActive={mode === AUTH_MODE.register}
                    onToggleMode={() => handleModeToggle(AUTH_MODE.login)}
                />
            )}
            registerTitle={t('auth.registerTitle')}
            serverWakeNotice={t('auth.serverWakeNotice')}
        />
    );
};

export default AuthPage;
