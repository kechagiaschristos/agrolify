import {getApiErrorMessage} from '../api/apiMessages.js';

export const getErrorMessage = (error) => {
    if (!error) {
        return null;
    }

    const sanitizeMessage = (value) => {
        const text = value?.toString?.();

        if (!text || text === '[object Object]') {
            return null;
        }

        return /<\/?[a-z][\s\S]*>/i.test(text) ? 'Something went wrong. Please try again.' : text;
    };

    if (error?.code || error?.errors) {
        return sanitizeMessage(getApiErrorMessage(error));
    }

    return sanitizeMessage(error?.message ?? error ?? getApiErrorMessage(error));
};
