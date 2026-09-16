import API from '../../../shared/api/axiosInstance.js';

export const fetchWateringLogsRequest = (params = {}) =>
    API.get('/watering_logs', {params});
