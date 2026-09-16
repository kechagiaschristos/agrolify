import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    fetchLatestMeasurementsRequest,
    fetchMeasurementsRequest,
} from './measurementsRequests.js';
import {normalizeMeasurement, normalizeMeasurements} from './measurementDataUtils.js';
import {clearUserState} from '../../profile/store/userSlice.js';

const MAX_LATEST_MEASUREMENTS = 5;

const mergeLatestMeasurement = (measurements, nextMeasurement) => (
    [
        nextMeasurement,
        ...(measurements ?? []).filter((measurement) => (
            String(measurement?.id ?? '') !== String(nextMeasurement?.id ?? '')
        )),
    ].sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).slice(0, MAX_LATEST_MEASUREMENTS)
);

const getInitialState = () => ({
    airMeasurements: [],
    soilMeasurements: [],
    waterMeasurements: [],
    latestMeasurement: [],
    fetchLatestMeasurementLoading: false,
    fetchAirMeasurementsLoading: false,
    fetchSoilMeasurementsLoading: false,
    fetchWaterMeasurementsLoading: false,
});

const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

export const fetchLatestMeasurement = createAsyncThunk(
    'measurements/fetchLatestMeasurement',
    async (_, {rejectWithValue}) => {
        try {
            return (await fetchLatestMeasurementsRequest()).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const fetchAirMeasurements = createAsyncThunk(
    'measurements/fetchAirMeasurements',
    async (data, {rejectWithValue}) => {
        try {
            return (await fetchMeasurementsRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const fetchSoilMeasurements = createAsyncThunk(
    'measurements/fetchSoilMeasurements',
    async (data, {rejectWithValue}) => {
        try {
            return (await fetchMeasurementsRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const fetchWaterMeasurements = createAsyncThunk(
    'measurements/fetchWaterMeasurements',
    async (data, {rejectWithValue}) => {
        try {
            return (await fetchMeasurementsRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

const measurementsSlice = createSlice({
    name: 'measurements',
    initialState: getInitialState(),
    reducers: {
        receiveLiveMeasurement: (state, action) => {
            const nextMeasurement = normalizeMeasurement(action.payload);
            if (!nextMeasurement) {
                return;
            }

            state.latestMeasurement = mergeLatestMeasurement(state.latestMeasurement, nextMeasurement);
            state.fetchLatestMeasurementLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchLatestMeasurement.pending, (state) => {
                state.fetchLatestMeasurementLoading = true;
            })
            .addCase(fetchLatestMeasurement.fulfilled, (state, action) => {
                state.latestMeasurement = normalizeMeasurements(action.payload.measurements);
                state.fetchLatestMeasurementLoading = false;
            })
            .addCase(fetchLatestMeasurement.rejected, (state) => {
                state.fetchLatestMeasurementLoading = false;
            })
            .addCase(fetchAirMeasurements.pending, (state) => {
                state.fetchAirMeasurementsLoading = true;
            })
            .addCase(fetchAirMeasurements.fulfilled, (state, action) => {
                state.airMeasurements = normalizeMeasurements(action.payload.measurements);
                state.fetchAirMeasurementsLoading = false;
            })
            .addCase(fetchAirMeasurements.rejected, (state) => {
                state.fetchAirMeasurementsLoading = false;
            })
            .addCase(fetchSoilMeasurements.pending, (state) => {
                state.fetchSoilMeasurementsLoading = true;
            })
            .addCase(fetchSoilMeasurements.fulfilled, (state, action) => {
                state.soilMeasurements = normalizeMeasurements(action.payload.measurements);
                state.fetchSoilMeasurementsLoading = false;
            })
            .addCase(fetchSoilMeasurements.rejected, (state) => {
                state.fetchSoilMeasurementsLoading = false;
            })
            .addCase(fetchWaterMeasurements.pending, (state) => {
                state.fetchWaterMeasurementsLoading = true;
            })
            .addCase(fetchWaterMeasurements.fulfilled, (state, action) => {
                state.waterMeasurements = normalizeMeasurements(action.payload.measurements);
                state.fetchWaterMeasurementsLoading = false;
            })
            .addCase(fetchWaterMeasurements.rejected, (state) => {
                state.fetchWaterMeasurementsLoading = false;
            });
    },
});

export const {receiveLiveMeasurement} = measurementsSlice.actions;

export const measurementsReducer = measurementsSlice.reducer;
