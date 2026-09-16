import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchWateringLogsRequest} from './wateringLogsRequests.js';
import {clearUserState} from '../../profile/store/userSlice.js';

const getInitialState = () => ({
    data: [],
    total: 0,
    page: 1,
    fetchWateringLogsLoading: false,
    fetchWateringLogsError: null,
});

const getActionError = (action) => action.payload ?? action.error?.message ?? null;

export const fetchWateringLogs = createAsyncThunk(
    'wateringLogs/fetchWateringLogs',
    async (params = {}, {rejectWithValue}) => {
        try {
            const response = await fetchWateringLogsRequest(params);
            return {
                ...response.data,
                requestedPage: params?.page ?? 1,
            };
        } catch (error) {
            return rejectWithValue(
                error?.response?.data ?? {message: error?.message ?? 'Request failed'},
            );
        }
    },
);

const wateringLogsSlice = createSlice({
    name: 'wateringLogs',
    initialState: getInitialState(),
    reducers: {
        resetWateringLogs: () => getInitialState(),
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchWateringLogs.pending, (state) => {
                state.fetchWateringLogsLoading = true;
                state.fetchWateringLogsError = null;
            })
            .addCase(fetchWateringLogs.fulfilled, (state, action) => {
                const logs = action.payload?.watering_logs ?? [];
                const requestedPage = Number(action.payload?.requestedPage ?? 1);
                const nextLogs = requestedPage > 1
                    ? [...state.data, ...logs]
                    : logs;

                const uniqueLogs = [];
                const seenIds = new Set();

                nextLogs.forEach((log) => {
                    const key = String(log?.id);

                    if (seenIds.has(key)) {
                        return;
                    }

                    seenIds.add(key);
                    uniqueLogs.push(log);
                });

                state.data = uniqueLogs.sort((left, right) => {
                    const leftTime = left?.started_at ? new Date(left.started_at).getTime() : 0;
                    const rightTime = right?.started_at ? new Date(right.started_at).getTime() : 0;
                    return rightTime - leftTime;
                });
                state.total = action.payload?.total ?? state.data.length;
                state.page = Number(action.payload?.page ?? requestedPage);
                state.fetchWateringLogsLoading = false;
                state.fetchWateringLogsError = null;
            })
            .addCase(fetchWateringLogs.rejected, (state, action) => {
                state.fetchWateringLogsLoading = false;
                state.fetchWateringLogsError = getActionError(action);
            });
    },
});

export const {resetWateringLogs} = wateringLogsSlice.actions;
export const wateringLogsReducer = wateringLogsSlice.reducer;
