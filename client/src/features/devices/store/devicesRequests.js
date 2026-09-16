import API from '../../../shared/api/axiosInstance.js';

export const fetchDevicesRequest = (params = {}) => API.get('/devices', {params});

export const attachDeviceRequest = (deviceCode) =>
    API.post(`/devices/${deviceCode}/attach`);

export const updateDeviceRequest = (deviceCode, data) =>
    API.patch(`/devices/${deviceCode}`, {device: data});

export const deleteDeviceRequest = (deviceCode) =>
    API.delete(`/devices/${deviceCode}/detach`);
