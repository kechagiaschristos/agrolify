import {createAction, createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    attachDeviceRequest,
    deleteDeviceRequest,
    fetchDevicesRequest,
    updateDeviceRequest,
} from './devicesRequests.js';
import {getDeviceCode} from './devicesSelectors.js';
import {fetchFans} from '../../air/store/fansSlice.js';
import {fetchLatestMeasurement} from '../../measurements/store/measurementsSlice.js';
import {clearUserState, updateUser} from '../../profile/store/userSlice.js';
import {fetchWateringSchedules} from '../../water/store/wateringSchedulesSlice.js';
import {fetchWindow} from '../../water/store/windowsSlice.js';

const getInitialState = () => ({
    devices: [],
    selectDeviceLoading: false,
    hasFetchedDevices: false,
    fetchDevicesLoading: false,
    fetchDevicesError: null,
    attachDeviceLoading: false,
    updateDeviceLoading: false,
    deleteDeviceLoading: false,
});

const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

export const fetchDevices = createAsyncThunk(
    'devices/fetchDevices',
    async (params = {}, {rejectWithValue}) => {
        try {
            return (await fetchDevicesRequest(params)).data.devices ?? [];
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const updateDevice = createAsyncThunk(
    'devices/updateDevice',
    async ({deviceCode, data}, {rejectWithValue}) => {
        try {
            return (await updateDeviceRequest(deviceCode, data)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const attachDevice = createAsyncThunk(
    'devices/attachDevice',
    async ({deviceCode}, {rejectWithValue}) => {
        try {
            return (await attachDeviceRequest(deviceCode)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const deleteDevice = createAsyncThunk(
    'devices/deleteDevice',
    async ({deviceCode}, {rejectWithValue}) => {
        try {
            return (await deleteDeviceRequest(deviceCode)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const loadSelectedDeviceData = (deviceCode) => async (dispatch, getState) => {
    if (!deviceCode || getState().user.user?.selected_device_code !== deviceCode) {
        return null;
    }

    await Promise.allSettled([
        dispatch(fetchFans()),
        dispatch(fetchWateringSchedules()),
        dispatch(fetchWindow()),
        dispatch(fetchLatestMeasurement()),
    ]);

    return deviceCode;
};

const selectionStarted = createAction('devices/selectionStarted');
const selectionFinished = createAction('devices/selectionFinished');

export const selectDevice = (deviceCode) => async (dispatch, getState) => {
    if (getState().devices.selectDeviceLoading) return null;
    dispatch(selectionStarted());
    try {
        await dispatch(updateUser({data: {selected_device_code: deviceCode}})).unwrap();
        await dispatch(loadSelectedDeviceData(deviceCode));
        return deviceCode;
    } finally {
        dispatch(selectionFinished());
    }
};

const devicesSlice = createSlice({
    name: 'devices',
    initialState: getInitialState(),
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(selectionStarted, (state) => { state.selectDeviceLoading = true; })
            .addCase(selectionFinished, (state) => { state.selectDeviceLoading = false; })
            .addCase(fetchDevices.pending, (state) => {
                state.fetchDevicesLoading = true;
                state.fetchDevicesError = null;
            })
            .addCase(fetchDevices.fulfilled, (state, action) => {
                state.devices = action.payload;
                state.hasFetchedDevices = true;
                state.fetchDevicesLoading = false;
                state.fetchDevicesError = null;
            })
            .addCase(fetchDevices.rejected, (state, action) => {
                state.hasFetchedDevices = true;
                state.fetchDevicesLoading = false;
                state.fetchDevicesError = action.payload ?? action.error?.message ?? null;
            })
            .addCase(attachDevice.pending, (state) => {
                state.attachDeviceLoading = true;
            })
            .addCase(attachDevice.fulfilled, (state, action) => {
                upsertDevice(state, action.payload.device);
                state.attachDeviceLoading = false;
            })
            .addCase(attachDevice.rejected, (state) => {
                state.attachDeviceLoading = false;
            })
            .addCase(updateDevice.pending, (state) => {
                state.updateDeviceLoading = true;
            })
            .addCase(updateDevice.fulfilled, (state, action) => {
                upsertDevice(state, action.payload.device);
                state.updateDeviceLoading = false;
            })
            .addCase(updateDevice.rejected, (state) => {
                state.updateDeviceLoading = false;
            })
            .addCase(deleteDevice.pending, (state) => {
                state.deleteDeviceLoading = true;
            })
            .addCase(deleteDevice.fulfilled, (state, action) => {
                state.devices = state.devices.filter(
                    (device) => String(getDeviceCode(device)) !== String(action.meta.arg?.deviceCode),
                );
                state.deleteDeviceLoading = false;
            })
            .addCase(deleteDevice.rejected, (state) => {
                state.deleteDeviceLoading = false;
            });
    },
});

const upsertDevice = (state, nextDevice) => {
    const nextDeviceCode = getDeviceCode(nextDevice);
    const existingIndex = state.devices.findIndex(
        (device) => String(getDeviceCode(device)) === String(nextDeviceCode),
    );

    if (existingIndex >= 0) {
        state.devices[existingIndex] = nextDevice ?? state.devices[existingIndex];
    } else if (nextDeviceCode) {
        state.devices.push(nextDevice);
    }
};

export const devicesReducer = devicesSlice.reducer;
