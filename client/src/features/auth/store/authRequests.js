import API from '../../../shared/api/axiosInstance.js';

export function registerRequest(data) {
    return API.post('/auth/register', data);
}

export function loginRequest(data) {
    return API.post('/auth/login', data);
}

export function logoutRequest() {
    return API.delete('/auth/logout');
}
