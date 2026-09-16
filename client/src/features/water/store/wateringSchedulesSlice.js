import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    createWateringScheduleRequest,
    deleteWateringScheduleRequest,
    fetchWateringSchedulesRequest,
    updateWateringScheduleRequest,
} from './wateringSchedulesRequests.js';
import {clearUserState} from '../../profile/store/userSlice.js';

const getInitialState = () => ({
    schedules: [],
    fetchWateringSchedulesLoading: false,
});

const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

export const fetchWateringSchedules = createAsyncThunk(
    'wateringSchedules/fetchWateringSchedules',
    async ({params = {}} = {}, {rejectWithValue}) => {
        try {
            return (await fetchWateringSchedulesRequest(params)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const createWateringSchedule = createAsyncThunk(
    'wateringSchedules/createWateringSchedule',
    async ({data}, {rejectWithValue}) => {
        try {
            return (await createWateringScheduleRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const deleteWateringSchedule = createAsyncThunk(
    'wateringSchedules/deleteWateringSchedule',
    async (data, {rejectWithValue}) => {
        try {
            return (await deleteWateringScheduleRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const updateWateringSchedule = createAsyncThunk(
    'wateringSchedules/updateWateringSchedule',
    async (data, {rejectWithValue}) => {
        try {
            return (await updateWateringScheduleRequest(data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

const wateringSchedulesSlice = createSlice({
    name: 'wateringSchedules',
    initialState: getInitialState(),
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchWateringSchedules.pending, (state) => {
                state.fetchWateringSchedulesLoading = true;
            })
            .addCase(fetchWateringSchedules.fulfilled, (state, action) => {
                state.schedules = action.payload?.watering_schedules ?? [];
                state.fetchWateringSchedulesLoading = false;
            })
            .addCase(fetchWateringSchedules.rejected, (state) => {
                state.fetchWateringSchedulesLoading = false;
            })
            .addCase(createWateringSchedule.fulfilled, (state, action) => {
                const nextSchedules = action.payload?.watering_schedules ?? [];

                if (nextSchedules.length > 0) {
                    state.schedules = nextSchedules;
                }
            })
            .addCase(updateWateringSchedule.fulfilled, (state, action) => {
                const updatedSchedule = action.payload?.watering_schedule ?? null;

                if (!updatedSchedule) {
                    return;
                }

                state.schedules = state.schedules.map((schedule) => (
                    String(schedule?.id) === String(updatedSchedule?.id)
                        ? updatedSchedule
                        : schedule
                ));
            })
            .addCase(deleteWateringSchedule.fulfilled, (state, action) => {
                state.schedules = state.schedules.filter(
                    (schedule) => String(schedule?.id) !== String(action.payload?.schedule_id ?? action.payload?.scheduleId ?? action.meta.arg?.scheduleId),
                );
            });
    },
});

export const wateringSchedulesReducer = wateringSchedulesSlice.reducer;
