import {lazy, Suspense, useState} from 'react';
import {
    BellOutlined,
    GlobalOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuOutlined,
    MenuUnfoldOutlined,
    MoonOutlined,
    SettingOutlined,
    SunOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {Avatar, Button, Drawer, Dropdown, Layout, Popover, Spin, theme, Tooltip} from 'antd';
import {Link, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {logoutUser} from '../../features/auth/store/authSlice.js';
import {updateUser} from '../../features/profile/store/userSlice';
import {storeLanguage, storeThemePreference} from '../storage/appStorage.js';
import Alert from '../components/Alert.jsx';
import DeviceSelector from '../components/deviceSelector/index.jsx';
import routePaths from '../../app/router/routePaths.json';
import headerLogo from '../assets/logo/header-logo.png';
import {useTranslation} from 'react-i18next';
import {
    selectActiveTheme,
    selectCurrentUser,
} from '../../features/profile/store/userSelectors';
import {
    selectFetchNotificationsLoading,
    selectNotifications,
    selectUnreadNotificationCount,
} from '../../features/notifications/store/notificationsSelectors.js';
import {selectSelectedDevice} from '../../features/devices/store/devicesSelectors.js';

const {Header: AntHeader} = Layout;
const DeviceSettings = lazy(() => import('../components/deviceSettings/index.jsx'));
const Notifications = lazy(() => import('../components/Notifications.jsx'));

function DeferredPanelFallback({minHeight = 120, width}) {
    const {token} = theme.useToken();

    return (
        <div
            style={{
                width,
                maxWidth: width ? 'calc(100vw - 24px)' : undefined,
                minHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: width ? token.colorBgElevated : undefined,
                borderRadius: width ? token.borderRadiusLG : undefined,
            }}
        >
            <Spin size="large" />
        </div>
    );
}

const Header = ({collapsed, isDesktop, showSidebarControls = true, onMenuClick, onToggleCollapse}) => {
    const {token} = theme.useToken();
    const {t, i18n} = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [deviceSettingsDeviceId, setDeviceSettingsDeviceId] = useState(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [accountMenuOpenKeys, setAccountMenuOpenKeys] = useState([]);
    const user = useSelector(selectCurrentUser);
    const selectedDevice = useSelector(selectSelectedDevice);
    const notifications = useSelector(selectNotifications);
    const notificationsLoading = useSelector(selectFetchNotificationsLoading);
    const unreadNotificationCount = useSelector(selectUnreadNotificationCount);
    const activeTheme = useSelector(selectActiveTheme);
    const deviceSettingsLabel = t('header.deviceSettings');
    const hasUnreadNotifications = unreadNotificationCount > 0;
    const notificationsPanelWidth = isDesktop
        ? 360
        : 'min(320px, calc(100vw - 24px))';
    const hasSelectedDevice = Boolean(selectedDevice);
    const deviceSettingsOpen = Boolean(
        selectedDevice?.id
        && String(deviceSettingsDeviceId) === String(selectedDevice.id),
    );
    const accountMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined/>,
            label: t('header.profile'),
        },
        {type: 'divider'},
        {
            key: 'language',
            icon: <GlobalOutlined />,
            label: t('language.label'),
            children: [
                {key: 'language:en', label: 'English'},
                {key: 'language:el', label: 'Ελληνικά'},
            ],
        },
        {
            key: 'theme',
            icon: activeTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
            label: t('header.theme'),
            children: [
                {
                    key: 'theme:light',
                    icon: <SunOutlined />,
                    label: t('header.lightTheme'),
                },
                {
                    key: 'theme:dark',
                    icon: <MoonOutlined />,
                    label: t('header.darkTheme'),
                },
            ],
        },
        {type: 'divider'},
        {
            key: 'logout',
            icon: <LogoutOutlined/>,
            danger: true,
            label: t('header.logout'),
        },
    ];
    const brandLink = (
        <Link
            to={routePaths.dashboard}
            aria-label={t('app.name')}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: isDesktop ? 10 : 8,
                minWidth: 0,
                color: token.colorText,
                textDecoration: 'none',
                flexShrink: 0,
            }}
        >
            <img
                src={headerLogo}
                alt=""
                aria-hidden="true"
                draggable="false"
                style={{
                    width: isDesktop ? 32 : 28,
                    height: isDesktop ? 32 : 28,
                    objectFit: 'cover',
                    flexShrink: 0,
                }}
            />
            <span
                style={{
                    fontFamily: '"Inter", "Aptos Display", "Segoe UI Variable Display", "SF Pro Display", ui-sans-serif, system-ui, sans-serif',
                    fontSize: token.fontSizeXL,
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                }}
            >
                {t('app.name')}
            </span>
        </Link>
    );
    const handleThemeChange = async (key) => {
        if (!['light', 'dark'].includes(key) || key === activeTheme) {
            return;
        }

        await dispatch(updateUser({data: {theme: key}})).unwrap();
        storeThemePreference(key);
        Alert.show({type: 'success', message: t('account.messages.themeUpdated')});
    };

    const handleLanguageChange = async (key) => {
        await dispatch(updateUser({data: {locale: key}})).unwrap();
        storeLanguage(key);
        i18n.changeLanguage(key);
        Alert.show({type: 'success', message: i18n.t('account.messages.languageUpdated')});
    };

    const handleMenuClick = async ({key}) => {
        setAccountMenuOpenKeys([]);

        const [menuSection, menuValue] = key.split(':');

        if (menuSection === 'language' && menuValue) {
            await handleLanguageChange(menuValue);
            return;
        }

        if (menuSection === 'theme' && menuValue) {
            await handleThemeChange(menuValue);
            return;
        }

        if (key === 'profile') {
            navigate(routePaths.profile);
        }

        if (key === 'logout') {
            await dispatch(logoutUser());
            navigate(routePaths.login, {replace: true});
        }
    };

    const handleAccountMenuOpenChange = (openKeys) => {
        const latestOpenKey = openKeys.find((key) => !accountMenuOpenKeys.includes(key));

        setAccountMenuOpenKeys(['language', 'theme'].includes(latestOpenKey) ? [latestOpenKey] : []);
    };
    const deviceSelector = hasSelectedDevice && (
        isDesktop ? (
            <div style={{flex: '0 0 auto', minWidth: 0}}>
                <DeviceSelector />
            </div>
        ) : <DeviceSelector modalTrigger />
    );
    const deviceSettingsButton = hasSelectedDevice ? (
        <Button
            type="text"
            shape="circle"
            size="large"
            icon={<SettingOutlined style={{fontSize: 16}} />}
            onClick={() => setDeviceSettingsDeviceId(selectedDevice.id)}
            aria-label={!isDesktop ? deviceSettingsLabel : undefined}
            style={{flexShrink: 0}}
        />
    ) : null;

    return (
        <>
            <AntHeader
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    height: 60,
                    lineHeight: '60px',
                    padding: isDesktop ? '0 20px 0 16px' : '0 8px',
                    background: token.colorBgContainer,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: isDesktop ? 16 : 8,
                    }}
                >
                    {showSidebarControls ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: isDesktop ? 12 : 8, flexShrink: 0}}>
                            <Button
                                type="text"
                                size="large"
                                icon={
                                    isDesktop
                                        ? collapsed
                                            ? <MenuUnfoldOutlined style={{fontSize: 16}} />
                                            : <MenuFoldOutlined style={{fontSize: 16}} />
                                        : <MenuOutlined style={{fontSize: 16}} />
                                }
                                onClick={isDesktop ? onToggleCollapse : onMenuClick}
                            />
                            {!isDesktop ? brandLink : null}
                        </div>
                    ) : brandLink}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: isDesktop ? 12 : 4,
                            flex: 1,
                            minWidth: 0,
                            marginRight: isDesktop ? 8 : 0,
                        }}
                    >
                        {deviceSelector}

                        {isDesktop && deviceSettingsButton ? (
                            <Tooltip title={deviceSettingsLabel}>{deviceSettingsButton}</Tooltip>
                        ) : deviceSettingsButton}

                        <Popover
                            content={(
                                <Suspense fallback={<DeferredPanelFallback minHeight={220} width={notificationsPanelWidth} />}>
                                    <Notifications enabled={notificationsOpen} panelWidth={notificationsPanelWidth} />
                                </Suspense>
                            )}
                            trigger="click"
                            placement={isDesktop ? 'bottomRight' : 'bottom'}
                            arrow={isDesktop}
                            overlayClassName={!isDesktop ? 'notifications-popover-mobile' : undefined}
                            open={notificationsOpen}
                            onOpenChange={setNotificationsOpen}
                            destroyOnHidden
                            styles={{body: {padding: 0}}}
                        >
                            <Button
                                className={hasUnreadNotifications ? 'notifications-button notifications-button--active' : 'notifications-button'}
                                type="text"
                                shape="circle"
                                size="large"
                                aria-label={t('notifications.title')}
                                aria-expanded={notificationsOpen}
                                icon={notificationsLoading && !notifications.length ? (
                                    <Spin size="small" />
                                ) : (
                                    <BellOutlined style={{fontSize: 16}} />
                                )}
                                style={{
                                    '--notifications-button-active-bg': token.colorPrimaryBg,
                                    flexShrink: 0,
                                    width: 40,
                                    height: 40,
                                    padding: 0,
                                    color: hasUnreadNotifications || notificationsOpen ? token.colorPrimary : undefined,
                                    background: notificationsOpen ? token.colorPrimaryBg : undefined,
                                }}
                            />
                        </Popover>

                        <Dropdown
                            menu={{
                                selectedKeys: [`language:${i18n.language === 'el' ? 'el' : 'en'}`, `theme:${activeTheme === 'dark' ? 'dark' : 'light'}`],
                                openKeys: accountMenuOpenKeys,
                                items: accountMenuItems,
                                onClick: handleMenuClick,
                                onOpenChange: handleAccountMenuOpenChange,
                                style: {minWidth: 196, borderInlineEnd: 'none'},
                            }}
                            classNames={{root: 'account-menu-dropdown'}}
                            styles={{
                                root: {'--account-menu-text-color': token.colorText},
                                item: {borderRadius: token.borderRadius},
                            }}
                            trigger={['click']}
                            destroyOnHidden
                        >
                            <Button
                                type="text"
                                shape="circle"
                                style={{
                                    width: 40,
                                    height: 40,
                                    padding: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                    marginInlineStart: 4,
                                    flexShrink: 0,
                                }}
                                aria-label={t('header.accountMenu')}
                            >
                                <Avatar
                                    size={32}
                                    src={user?.avatar}
                                    icon={<UserOutlined style={{fontSize: 16}} />}
                                />
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            </AntHeader>

            <Drawer
                title={deviceSettingsLabel}
                placement="right"
                size={isDesktop ? 720 : 'large'}
                open={deviceSettingsOpen}
                onClose={() => setDeviceSettingsDeviceId(null)}
                destroyOnHidden
            >
                {deviceSettingsOpen ? (
                    <Suspense fallback={<DeferredPanelFallback minHeight={320} />}>
                        <DeviceSettings />
                    </Suspense>
                ) : null}
            </Drawer>
        </>
    );
};

export default Header;
