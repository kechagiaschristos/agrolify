import API from '../../../shared/api/axiosInstance.js';

export const fetchNotificationsRequest = (params = {}) =>
    API.get('/notifications', { params });

export const updateNotificationRequest = (notificationId) =>
    API.patch(`/notifications/${notificationId}`);

export const deleteNotificationRequest = (notificationId) =>
    API.delete(`/notifications/${notificationId}`);
