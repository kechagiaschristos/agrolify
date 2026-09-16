import API from '../../../shared/api/axiosInstance.js';

export const fetchUserRequest = (config = {}) => API.get('/profile', config);

export const updateUserRequest = (data) => API.patch('/profile', {user: data});

export const deleteUserRequest = () => API.delete('/profile');
