import API from '../../../shared/api/axiosInstance.js';

export const fetchLatestMeasurementsRequest = () =>
    API.get('/measurements/latest');

export const fetchMeasurementsRequest = ({type, period, date}) => (
    API.get('/measurements', {
        params: { type, period, date },
    })
);
