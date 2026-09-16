import {Link, useLocation, useNavigate} from 'react-router-dom';
import {Menu, theme} from 'antd';
import {useSelector} from 'react-redux';
import sidebarNavigation from '../../app/router/SidebarNavigation.jsx';
import routePaths from '../../app/router/routePaths.json';
import {useTranslation} from 'react-i18next';
import {selectActiveTheme} from '../../features/profile/store/userSelectors.js';
import headerLogo from '../assets/logo/header-logo.png';

const Sidebar = ({collapsed = false, isMobile = false, onNavigate}) => {
    const {token} = theme.useToken();
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const isDarkTheme = useSelector(selectActiveTheme) === 'dark';

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: token.colorBgContainer,
            }}
        >
            <Link
                to={routePaths.dashboard}
                aria-label={t('navigation.dashboard')}
                onClick={() => onNavigate?.()}
                style={{
                    display: 'flex',
                    height: 60,
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : isMobile ? 8 : 10,
                    paddingInline: collapsed ? 0 : isMobile ? 16 : 24,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    color: token.colorText,
                    textDecoration: 'none',
                }}
            >
                <img
                    src={headerLogo}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    style={{
                        width: isMobile ? 28 : collapsed ? 34 : 32,
                        height: isMobile ? 28 : collapsed ? 34 : 32,
                        objectFit: 'cover',
                        flexShrink: 0,
                    }}
                />
                {!collapsed && (
                    <span
                        style={{
                            fontFamily: '"Inter", "Aptos Display", "Segoe UI Variable Display", "SF Pro Display", ui-sans-serif, system-ui, sans-serif',
                            fontSize: token.fontSizeXL,
                            fontWeight: 700,
                            lineHeight: 1,
                            flexShrink: 0,
                        }}
                    >
                        {t('app.name')}
                    </span>
                )}
            </Link>

            <div style={{flex: 1, overflowY: 'auto', padding: '12px 8px'}}>
                <Menu
                    mode="inline"
                    theme={isDarkTheme ? 'dark' : 'light'}
                    inlineCollapsed={collapsed}
                    selectedKeys={[location.pathname]}
                    onClick={({key}) => {
                        navigate(key);
                        onNavigate?.();
                    }}
                    items={sidebarNavigation.map(({titleKey, ...item}) => ({
                        ...item,
                        label: t(titleKey),
                    }))}
                    style={{borderInlineEnd: 'none', background: 'transparent'}}
                />
            </div>
        </div>
    );
};

export default Sidebar;
