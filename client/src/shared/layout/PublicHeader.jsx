import {GlobalOutlined, MoonOutlined, SunOutlined} from '@ant-design/icons';
import {Button, Dropdown, Flex, Grid, Layout, theme} from 'antd';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {Link, useNavigate} from 'react-router-dom';
import {storeLanguage} from '../storage/appStorage.js';
import {setThemePreference, updateUser} from '../../features/profile/store/userSlice.js';
import {selectActiveTheme, selectCurrentUser} from '../../features/profile/store/userSelectors.js';
import routePaths from '../../app/router/routePaths.json';
import headerLogo from '../assets/logo/header-logo.png';

const {Header} = Layout;
const {useBreakpoint} = Grid;

const PublicHeader = () => {
    const {token} = theme.useToken();
    const screens = useBreakpoint();
    const {t, i18n} = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const activeTheme = useSelector(selectActiveTheme);
    const currentUser = useSelector(selectCurrentUser);

    const isDarkTheme = activeTheme === 'dark';
    const isMobile = !screens.md;
    const isCompactMobile = !screens.sm;
    const activeThemeKey = isDarkTheme ? 'dark' : 'light';

    const handleLanguageChange = ({key}) => {
        i18n.changeLanguage(key);
        storeLanguage(key);
    };

    const handleThemeChange = ({key}) => {
        if (key === activeThemeKey) {
            return;
        }

        dispatch(setThemePreference(key));

        if (currentUser) {
            dispatch(updateUser({data: {theme: key}}));
        }
    };

    return (
        <Header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                height: 'auto',
                lineHeight: 'normal',
                padding: 0,
                background: isDarkTheme ? 'rgba(15, 17, 21, 0.72)' : 'rgba(255, 255, 255, 0.72)',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                backdropFilter: 'blur(18px)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 1120,
                    margin: '0 auto',
                    paddingInline: isCompactMobile ? 14 : isMobile ? 18 : 28,
                    minHeight: isCompactMobile ? 62 : 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: isCompactMobile ? 10 : 18,
                }}
            >
                <Link
                    to={routePaths.home}
                    aria-label={t('app.name')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 8 : 10,
                        textDecoration: 'none',
                        minWidth: 0,
                        flexShrink: 1,
                    }}
                >
                    <img
                        src={headerLogo}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                        style={{
                            width: isMobile ? 28 : 36,
                            height: isMobile ? 28 : 36,
                            objectFit: 'cover',
                            flexShrink: 0,
                        }}
                    />
                    <span
                        style={{
                            color: token.colorText,
                            fontFamily: '"Inter Tight", "Inter", "Arial", ui-sans-serif, system-ui, sans-serif',
                            fontSize: token.fontSizeXL,
                            fontWeight: 850,
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {t('app.name')}
                    </span>
                </Link>

                <Flex
                    align="center"
                    gap={isCompactMobile ? 8 : 12}
                    justify="flex-end"
                    style={{
                        flexShrink: 0,
                        flexWrap: 'nowrap',
                    }}
                >
                    <Dropdown
                        menu={{
                            selectedKeys: [i18n.language === 'el' ? 'el' : 'en'],
                            onClick: handleLanguageChange,
                            items: [
                                {key: 'en', label: 'English'},
                                {key: 'el', label: 'Ελληνικά'},
                            ],
                            style: {minWidth: 120, borderInlineEnd: 'none'},
                        }}
                        classNames={{root: 'header-language-dropdown'}}
                        styles={{item: {borderRadius: token.borderRadius}}}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            shape="circle"
                            size={isCompactMobile ? 'middle' : 'large'}
                            icon={<GlobalOutlined />}
                            aria-label={t('language.label')}
                            style={{flexShrink: 0}}
                        />
                    </Dropdown>

                    <Dropdown
                        menu={{
                            selectedKeys: [activeThemeKey],
                            onClick: handleThemeChange,
                            items: [
                                {
                                    key: 'light',
                                    icon: <SunOutlined />,
                                    label: t('header.lightTheme'),
                                },
                                {
                                    key: 'dark',
                                    icon: <MoonOutlined />,
                                    label: t('header.darkTheme'),
                                },
                            ],
                            style: {minWidth: 120, borderInlineEnd: 'none'},
                        }}
                        classNames={{root: 'header-language-dropdown'}}
                        styles={{item: {borderRadius: token.borderRadius}}}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            shape="circle"
                            size={isCompactMobile ? 'middle' : 'large'}
                            icon={isDarkTheme ? <MoonOutlined /> : <SunOutlined />}
                            aria-label={t('header.theme')}
                            style={{flexShrink: 0}}
                        />
                    </Dropdown>

                    <Button
                        type="primary"
                        size={isCompactMobile ? 'middle' : 'large'}
                        onClick={() => navigate(routePaths.login)}
                    >
                        {t('landing.headerLogin')}
                    </Button>
                </Flex>
            </div>
        </Header>
    );
};

export default PublicHeader;
