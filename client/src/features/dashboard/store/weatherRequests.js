import API from '../../../shared/api/axiosInstance.js';

export const fetchWeatherRequest = (locale = 'en') =>
    API.get('/weather', {params: {locale}});
