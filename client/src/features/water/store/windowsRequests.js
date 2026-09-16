import API from '../../../shared/api/axiosInstance.js';

export const fetchWindowsRequest = (params = {}) =>
    API.get('/window', {params});

export const updateWindowsRequest = ({data}) =>
    API.patch('/window', {window: data});
