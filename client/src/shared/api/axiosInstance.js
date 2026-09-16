import axios from 'axios';
import Alert from '../components/Alert.jsx';
import { getApiErrorMessage } from './apiMessages.js';

const normalizeBaseUrl = (value) => String(value || 'http://localhost:3000').replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(
    import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000',
);

export const buildApiUrl = (path = '/') => (
    new URL(path, `${API_BASE_URL}/`).toString()
);

const API = axios.create({
    baseURL: `${API_BASE_URL}/`,
    withCredentials: true,
});

let unauthorizedHandler;
let contextProvider = () => ({});
export const setUnauthorizedHandler = (handler) => { unauthorizedHandler = handler; };
export const setApiContextProvider = (provider) => { contextProvider = provider; };

API.interceptors.request.use((config) => {
    const context = contextProvider();
    config.sessionUserId = context.userId;
    if (/^\/(measurements|fan|window|watering_schedules|watering_logs|weather)(\/|$)/.test(config.url)) {
        config.params = {...config.params, device_code: context.deviceCode};
    }
    return config;
}, undefined, {synchronous: true});

API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && !err.config?.url?.startsWith('/auth/')
            && err.config?.sessionUserId === contextProvider().userId) {
            unauthorizedHandler?.();
        }
        const data = err.response?.data;
        const message = getApiErrorMessage(data);

        if (!err.config?.silent) {
            Alert.show({ type: 'error', message });
        }

        return Promise.reject({
            ...err,
            message,
            status: err.response?.status ?? null,
        });
    }
);

export default API;
