import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {clearStoredToken} from '../../../shared/storage/appStorage.js';
import {loginRequest, logoutRequest, registerRequest} from './authRequests.js';
import {clearUserState, fetchUser} from '../../profile/store/userSlice';
import {fetchDevices, loadSelectedDeviceData} from '../../devices/store/devicesSlice';

const getInitialState = () => ({
    isAuthenticated: false,
    checkAuthLoading: false,
    loginLoading: false,
    registerLoading: false,
});

const requestFailedPayload = (error) => error?.response?.data ?? {code: 'REQUEST_FAILED'};
const getSelectedDeviceCode = (state) => state.user?.user?.selected_device_code ?? null;

export const hydrateAuthenticatedSession = () => async (dispatch, getState) => {
    await dispatch(fetchDevices()).unwrap().catch(() => null);

    const selectedDeviceCode = getSelectedDeviceCode(getState());

    if (selectedDeviceCode) {
        void dispatch(loadSelectedDeviceData(selectedDeviceCode));
    }
};

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, {dispatch, rejectWithValue}) => {
    clearStoredToken();

    try {
        await dispatch(fetchUser({silent: true})).unwrap();
        void dispatch(hydrateAuthenticatedSession());
        return {isAuthenticated: true};
    } catch (error) {
        clearStoredToken();
        dispatch(clearUserState());
        return rejectWithValue(requestFailedPayload(error));
    }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (data, {dispatch, rejectWithValue}) => {
    try {
        const response = await loginRequest(data);
        clearStoredToken();
        await dispatch(checkAuth()).unwrap();
        return {...response.data, isAuthenticated: true};
    } catch (error) {
        return rejectWithValue(requestFailedPayload(error));
    }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (data, {dispatch, rejectWithValue}) => {
    try {
        const response = await registerRequest(data);
        clearStoredToken();
        await dispatch(checkAuth()).unwrap();
        return {...response.data, isAuthenticated: true};
    } catch (error) {
        return rejectWithValue(requestFailedPayload(error));
    }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, {dispatch}) => {
    try {
        await logoutRequest();
    } finally {
        clearStoredToken();
        dispatch(clearUserState());
    }
    return null;
});

const authSlice = createSlice({
    name: 'auth',
    initialState: getInitialState(),
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(checkAuth.pending, (state) => {
                state.checkAuthLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
                state.checkAuthLoading = false;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isAuthenticated = false;
                state.checkAuthLoading = false;
            })
            .addCase(registerUser.pending, (state) => {
                state.registerLoading = true;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
                state.registerLoading = false;
            })
            .addCase(registerUser.rejected, (state) => {
                state.registerLoading = false;
            })
            .addCase(loginUser.pending, (state) => {
                state.loginLoading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
                state.loginLoading = false;
            })
            .addCase(loginUser.rejected, (state) => {
                state.loginLoading = false;
            })
            .addCase(logoutUser.fulfilled, () => getInitialState());
    },
});

export const authReducer = authSlice.reducer;
