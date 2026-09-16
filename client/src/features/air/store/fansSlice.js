import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchFansRequest, updateFanRequest} from './fansRequests.js';
import {clearUserState} from '../../profile/store/userSlice.js';
import {isOlderControlSnapshot} from '../../../shared/utils/controlSnapshot.js';

const getInitialState = () => ({
    fan: null,
    fetchFansLoading: false,
});

const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

export const fetchFans = createAsyncThunk(
    'fans/fetchFans',
    async ({params = {}} = {}, {rejectWithValue}) => {
        try {
            return (await fetchFansRequest(params)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const updateFan = createAsyncThunk(
    'fans/updateFan',
    async ({data}, {rejectWithValue}) => {
        try {
            return (await updateFanRequest({data})).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

const normalizeFanPayload = (payload) => (
    payload?.fan
    ?? payload?.data
    ?? payload
    ?? null
);

const fansSlice = createSlice({
    name: 'fans',
    initialState: getInitialState(),
    reducers: {
        receiveLiveFan: (state, action) => {
            if (isOlderControlSnapshot(state.fan, action.payload)) return;
            state.fan = action.payload;
            state.fetchFansLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchFans.pending, (state) => {
                state.fetchFansLoading = true;
            })
            .addCase(fetchFans.fulfilled, (state, action) => {
                const fan = normalizeFanPayload(action.payload);
                if (!isOlderControlSnapshot(state.fan, fan)) state.fan = fan;
                state.fetchFansLoading = false;
            })
            .addCase(fetchFans.rejected, (state) => {
                state.fetchFansLoading = false;
            })
            .addCase(updateFan.fulfilled, (state, action) => {
                const fan = normalizeFanPayload(action.payload);
                if (!isOlderControlSnapshot(state.fan, fan)) state.fan = fan;
            });
    },
});

export const fansReducer = fansSlice.reducer;
export const {receiveLiveFan} = fansSlice.actions;
