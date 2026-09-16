import API from '../../../shared/api/axiosInstance.js';

export const fetchWateringSchedulesRequest = (params = {}) =>
    API.get('/watering_schedules', {params});

export const createWateringScheduleRequest = (data) =>
    API.post('/watering_schedules', {watering_schedule: data});

export const updateWateringScheduleRequest = ({scheduleId, ...data}) =>
    API.patch(`/watering_schedules/${scheduleId}`, {watering_schedule: data});

export const deleteWateringScheduleRequest = ({scheduleId}) =>
    API.delete(`/watering_schedules/${scheduleId}`);
