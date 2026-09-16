import API from '../../../shared/api/axiosInstance.js';

export const fetchFansRequest = (params = {}) =>
    API.get('/fan', {params});

export const updateFanRequest = ({data}) =>
    API.patch('/fan', {fan: data});
