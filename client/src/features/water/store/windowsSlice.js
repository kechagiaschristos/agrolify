import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchWindowsRequest, updateWindowsRequest} from './windowsRequests.js';
import {clearUserState} from '../../profile/store/userSlice.js';
import {isOlderControlSnapshot} from '../../../shared/utils/controlSnapshot.js';

const getInitialState = () => ({
    window: null,
    fetchWindowLoading: false,
});

const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

export const fetchWindow = createAsyncThunk(
    'windows/fetchWindow',
    async ({params = {}} = {}, {rejectWithValue}) => {
        try {
            return (await fetchWindowsRequest(params)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const updateWindow = createAsyncThunk(
    'windows/updateWindow',
    async ({data}, {rejectWithValue}) => {
        try {
            return (await updateWindowsRequest({data})).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

const normalizeWindowPayload = (payload) => (
    payload?.window
    ?? payload?.windows
    ?? payload?.data
    ?? payload
    ?? null
);

const windowsSlice = createSlice({
    name: 'windows',
    initialState: getInitialState(),
    reducers: {
        receiveLiveWindow: (state, action) => {
            if (isOlderControlSnapshot(state.window, action.payload)) return;
            state.window = action.payload;
            state.fetchWindowLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchWindow.pending, (state) => {
                state.fetchWindowLoading = true;
            })
            .addCase(fetchWindow.fulfilled, (state, action) => {
                const window = normalizeWindowPayload(action.payload);
                if (!isOlderControlSnapshot(state.window, window)) state.window = window;
                state.fetchWindowLoading = false;
            })
            .addCase(fetchWindow.rejected, (state) => {
                state.fetchWindowLoading = false;
            })
            .addCase(updateWindow.fulfilled, (state, action) => {
                const window = normalizeWindowPayload(action.payload);
                if (!isOlderControlSnapshot(state.window, window)) state.window = window;
            });
    },
});

export const windowsReducer = windowsSlice.reducer;
export const {receiveLiveWindow} = windowsSlice.actions;
