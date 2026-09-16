import {theme as antdTheme} from 'antd';

const DEFAULT_SHADOW = '0 12px 30px rgba(15, 23, 42, 0.08)';
const BASE_GAP = 16;
const BRAND_COLOR = '#0f9f6e';
const TYPOGRAPHY_TOKENS_BY_VIEWPORT = {
    mobile: {
        fontSize: 14,
        fontSizeSM: 12,
        fontSizeLG: 15,
        fontSizeXL: 17,
        fontSizeHeading1: 34,
        fontSizeHeading2: 28,
        fontSizeHeading3: 22,
        fontSizeHeading4: 18,
        fontSizeHeading5: 16,
        lineHeight: 1.5,
        lineHeightLG: 1.5,
        lineHeightSM: 1.4,
        lineHeightHeading1: 1.08,
        lineHeightHeading2: 1.12,
        lineHeightHeading3: 1.16,
        lineHeightHeading4: 1.2,
        lineHeightHeading5: 1.24,
    },
    tablet: {
        fontSize: 14,
        fontSizeSM: 12,
        fontSizeLG: 16,
        fontSizeXL: 18,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,
        lineHeight: 1.5,
        lineHeightLG: 1.5,
        lineHeightSM: 1.4,
        lineHeightHeading1: 1.06,
        lineHeightHeading2: 1.1,
        lineHeightHeading3: 1.14,
        lineHeightHeading4: 1.18,
        lineHeightHeading5: 1.22,
    },
    desktop: {
        fontSize: 14,
        fontSizeSM: 12,
        fontSizeLG: 16,
        fontSizeXL: 18,
        fontSizeHeading1: 40,
        fontSizeHeading2: 32,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,
        lineHeight: 1.5,
        lineHeightLG: 1.45,
        lineHeightSM: 1.4,
        lineHeightHeading1: 1.02,
        lineHeightHeading2: 1.08,
        lineHeightHeading3: 1.14,
        lineHeightHeading4: 1.18,
        lineHeightHeading5: 1.22,
    },
    wide: {
        fontSize: 15,
        fontSizeSM: 13,
        fontSizeLG: 17,
        fontSizeXL: 20,
        fontSizeHeading1: 46,
        fontSizeHeading2: 36,
        fontSizeHeading3: 28,
        fontSizeHeading4: 22,
        fontSizeHeading5: 18,
        lineHeight: 1.55,
        lineHeightLG: 1.5,
        lineHeightSM: 1.42,
        lineHeightHeading1: 0.98,
        lineHeightHeading2: 1.04,
        lineHeightHeading3: 1.1,
        lineHeightHeading4: 1.16,
        lineHeightHeading5: 1.2,
    },
};

const spacing = {
    padding: BASE_GAP,
    sectionGap: BASE_GAP,
    rowGap: BASE_GAP,
    buttonHeight: 44,
};

const dashboard = {
    padding: spacing.padding,
    sectionGap: spacing.sectionGap,
    headerGap: spacing.rowGap,
    buttonHeight: spacing.buttonHeight,
};

const getShellStyle = (token) => ({
    width: '100%',
    height: '100%',
    minWidth: 0,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary || DEFAULT_SHADOW,
});

const getNestedPanelStyle = (token) => ({
    background: token.colorBgElevated,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
});

const getTooltipStyle = (token) => ({
    ...getNestedPanelStyle(token),
    padding: '8px 10px',
    boxShadow: token.boxShadowSecondary || DEFAULT_SHADOW,
});

export const getAntdThemeConfig = (activeTheme = 'light', viewport = 'desktop') => {
    const isDarkTheme = activeTheme === 'dark';
    const isMobileDarkTheme = isDarkTheme && viewport === 'mobile';
    const typographyTokens = TYPOGRAPHY_TOKENS_BY_VIEWPORT[viewport] || TYPOGRAPHY_TOKENS_BY_VIEWPORT.desktop;

    return {
        algorithm: isDarkTheme ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
            colorPrimary: BRAND_COLOR,
            colorInfo: BRAND_COLOR,
            colorBgLayout: isDarkTheme ? '#0f1115' : '#f5f7fb',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            ...typographyTokens,
            borderRadius: 14,
            borderRadiusLG: 20,
        },
        components: {
            Layout: {
                headerBg: 'transparent',
                siderBg: isDarkTheme ? '#141414' : '#ffffff',
                bodyBg: isDarkTheme ? '#0f1115' : '#f5f7fb',
                footerBg: 'transparent',
                triggerBg: isDarkTheme ? '#141414' : '#ffffff',
            },
            Card: {
                borderRadiusLG: 20,
            },
            Menu: isDarkTheme
                ? {
                    darkItemBg: 'transparent',
                    darkSubMenuItemBg: 'transparent',
                    darkItemSelectedBg: BRAND_COLOR,
                    darkItemHoverBg: 'rgba(255,255,255,0.08)',
                }
                : {
                    itemSelectedBg: '#d9f8ea',
                    itemHoverBg: '#eefcf6',
                },
            Drawer: {
                colorBgElevated: isDarkTheme ? '#141414' : '#ffffff',
            },
            Select: isMobileDarkTheme
                ? {
                    selectorBg: '#18181b',
                    hoverBorderColor: 'rgba(255, 255, 255, 0.14)',
                    activeBorderColor: BRAND_COLOR,
                    activeOutlineColor: 'rgba(15, 159, 110, 0.16)',
                    optionActiveBg: 'rgba(255, 255, 255, 0.07)',
                    optionSelectedBg: 'rgba(15, 159, 110, 0.3)',
                    optionSelectedColor: '#f3fff8',
                }
                : {},
        },
    };
};

const appThemeConfig = {
    card: {
        spacing,
        dashboard,
        styles: {
            shell: getShellStyle,
            nestedPanel: getNestedPanelStyle,
            tooltip: getTooltipStyle,
        },
    },
};

export default appThemeConfig;
