import {useEffect, useMemo, useState} from 'react';
import {App, ConfigProvider, Grid, theme as antdTheme} from 'antd';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import {useSelector} from 'react-redux';
import {HelmetProvider} from 'react-helmet-async';
import enUS from 'antd/locale/en_US';
import elGR from 'antd/locale/el_GR';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import router from './router';
import store from './store';
import Realtime from './realtime';
import i18n from '../shared/i18n';
import Alert from '../shared/components/Alert.jsx';
import {selectActiveTheme} from '../features/profile/store/userSelectors';
import {getAntdThemeConfig} from '../shared/theme/appThemeConfig';

dayjs.extend(localizedFormat);

const LOCALES = {
    en: { antd: enUS, dayjs: 'en' },
    el: { antd: elGR, dayjs: 'el' },
};

const getViewportThemeKey = (screens) => {
    if (screens.xxl) {
        return 'wide';
    }

    if (screens.lg) {
        return 'desktop';
    }

    if (screens.md) {
        return 'tablet';
    }

    return 'mobile';
};

const ThemedApp = ({language}) => {
    const screens = Grid.useBreakpoint();
    const activeTheme = useSelector(selectActiveTheme);
    const viewportThemeKey = getViewportThemeKey(screens);
    const themeConfig = useMemo(
        () => getAntdThemeConfig(activeTheme, viewportThemeKey),
        [activeTheme, viewportThemeKey],
    );

    useEffect(() => {
        const tokens = antdTheme.getDesignToken(themeConfig);
        document.body.setAttribute('data-theme-version', activeTheme);
        document.documentElement.style.backgroundColor = tokens.colorBgLayout;
        document.body.style.backgroundColor = tokens.colorBgLayout;
        document.documentElement.style.colorScheme = activeTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.style.setProperty('--app-font-family', tokens.fontFamily);
        document.documentElement.style.setProperty('--app-font-size', `${tokens.fontSize}px`);
        document.documentElement.style.setProperty('--app-font-size-sm', `${tokens.fontSizeSM}px`);
        document.documentElement.style.setProperty('--app-font-size-lg', `${tokens.fontSizeLG}px`);
        document.documentElement.style.setProperty('--app-font-size-xl', `${tokens.fontSizeXL}px`);
        document.documentElement.style.setProperty('--app-font-size-heading-1', `${tokens.fontSizeHeading1}px`);
        document.documentElement.style.setProperty('--app-font-size-heading-2', `${tokens.fontSizeHeading2}px`);
        document.documentElement.style.setProperty('--app-font-size-heading-3', `${tokens.fontSizeHeading3}px`);
        document.documentElement.style.setProperty('--app-font-size-heading-4', `${tokens.fontSizeHeading4}px`);
        document.documentElement.style.setProperty('--app-font-size-heading-5', `${tokens.fontSizeHeading5}px`);
        document.documentElement.style.setProperty('--app-line-height', String(tokens.lineHeight));
        document.documentElement.style.setProperty('--app-line-height-sm', String(tokens.lineHeightSM));
        document.documentElement.style.setProperty('--app-line-height-lg', String(tokens.lineHeightLG));
        document.documentElement.style.setProperty('--app-line-height-heading-1', String(tokens.lineHeightHeading1));
        document.documentElement.style.setProperty('--app-line-height-heading-2', String(tokens.lineHeightHeading2));
        document.documentElement.style.setProperty('--app-line-height-heading-3', String(tokens.lineHeightHeading3));
        document.documentElement.style.setProperty('--app-line-height-heading-4', String(tokens.lineHeightHeading4));
        document.documentElement.style.setProperty('--app-line-height-heading-5', String(tokens.lineHeightHeading5));
    }, [activeTheme, themeConfig]);

    return (
        <ConfigProvider locale={LOCALES[language].antd} theme={themeConfig}>
            <App>
                <Alert />
                <RouterProvider router={router} />
            </App>
        </ConfigProvider>
    );
};

const AppProvider = () => {
    const [language, setLanguage] = useState(
        LOCALES[i18n.language] ? i18n.language : 'en'
    );

    useEffect(() => {
        const updateLanguage = () => {
            const lang = LOCALES[i18n.language] ? i18n.language : 'en';
            setLanguage(lang);
            dayjs.locale(LOCALES[lang].dayjs);
            localStorage.setItem('app_language', lang);
            document.documentElement.lang = lang;
        };

        updateLanguage();
        i18n.on('languageChanged', updateLanguage);
        return () => {
            i18n.off('languageChanged', updateLanguage);
        };
    }, []);

    return (
        <Provider store={store}>
            <HelmetProvider>
                <Realtime />
                <ThemedApp language={language} />
            </HelmetProvider>
        </Provider>
    );
};

export default AppProvider;
