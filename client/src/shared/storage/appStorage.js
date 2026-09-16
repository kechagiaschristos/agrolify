const STORAGE_KEYS = {
    legacyToken: 'token',
    theme: 'app_theme',
    language: 'app_language',
};

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const clearStoredToken = () => {
    if (!hasStorage()) {
        return;
    }

    window.localStorage.removeItem(STORAGE_KEYS.legacyToken);
};

export const getStoredThemePreference = () => {
    if (!hasStorage()) {
        return 'light';
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
    const theme = storedTheme === 'dark' ? 'dark' : 'light';

    if (storedTheme !== theme) {
        window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    }

    return theme;
};

export const storeThemePreference = (theme) => {
    if (!hasStorage()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
};

export const storeLanguage = (language) => {
    if (!hasStorage()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEYS.language, language);
};
