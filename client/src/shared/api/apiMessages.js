import i18n from '../i18n/index.js';

const FALLBACK_ERROR_KEY = 'api.fallback.requestFailed';

const joinErrors = (errors) => (
    Array.isArray(errors) ? errors.filter(Boolean).join(', ') : null
);

const extractHtmlErrorMessage = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const htmlMessageMatch = value.match(/<div class="message">\s*([^<]+)\s*<\/div>/i);
    if (htmlMessageMatch?.[1]) {
        return htmlMessageMatch[1].trim();
    }

    const titleMatch = value.match(/<title>\s*([^<]+)\s*<\/title>/i);
    if (titleMatch?.[1]) {
        return titleMatch[1].trim();
    }

    return null;
};

const getTranslatedApiCode = (code) => {
    if (!code || typeof code !== 'string') {
        return null;
    }

    const key = `api.codes.${code}`;
    const translation = i18n.t(key);

    return translation === key ? null : translation;
};

export const getApiSuccessMessage = (payload) => (
    typeof payload === 'object' && payload !== null
        ? getTranslatedApiCode(payload.code)
        : null
);

export const getApiErrorMessage = (payload) => {
    if (typeof payload === 'string') {
        return extractHtmlErrorMessage(payload) || payload || i18n.t(FALLBACK_ERROR_KEY);
    }

    if (!payload || typeof payload !== 'object') {
        return i18n.t(FALLBACK_ERROR_KEY);
    }

    return (
        joinErrors(payload.errors)
        || getTranslatedApiCode(payload.code)
        || extractHtmlErrorMessage(payload.error)
        || payload.error
        || extractHtmlErrorMessage(payload.message)
        || payload.message
        || i18n.t(FALLBACK_ERROR_KEY)
    );
};
