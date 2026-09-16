import {createAction, createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    clearStoredToken,
    getStoredThemePreference,
    storeThemePreference,
} from '../../../shared/storage/appStorage.js';
import {
    deleteUserRequest,
    fetchUserRequest,
    updateUserRequest,
} from './userRequests.js';
import {avatarOptions} from '../../../shared/utils/avatarOptions.js';

const getInitialState = () => ({
    user: null,
    themePreference: getStoredThemePreference(),
    updateUserLoading: false,
    updateUserError: null,
    deleteUserLoading: false,
    deleteUserError: null,
});

const getActionError = (action) => action.payload ?? action.error?.message ?? null;
const requestFailedPayload = (error) => error?.response?.data ?? {code: 'REQUEST_FAILED'};

export const clearUserState = createAction('user/clearUserState');

const normalizeUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        ...user,
        avatar: avatarOptions.find((option) => option.filename === user.avatar)?.url ?? user.avatar,
    };
};

export const fetchUser = createAsyncThunk('user/fetchUser', async (options = {}, {rejectWithValue}) => {
    try {
        const response = await fetchUserRequest(options);
        return response.data;
    } catch (error) {
        return rejectWithValue(requestFailedPayload(error));
    }
});

export const updateUser = createAsyncThunk('user/updateUser', async ({data}, {rejectWithValue}) => {
    try {
        const response = await updateUserRequest(data);
        return response.data;
    } catch (error) {
        return rejectWithValue(requestFailedPayload(error));
    }
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (_, {dispatch, rejectWithValue}) => {
    try {
        await deleteUserRequest();
        clearStoredToken();
        dispatch(clearUserState());
        return {success: true};
    } catch (error) {
        return rejectWithValue(requestFailedPayload(error));
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState: getInitialState(),
    reducers: {
        setThemePreference: (state, action) => {
            state.themePreference = action.payload === 'dark' ? 'dark' : 'light';
            storeThemePreference(state.themePreference);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = normalizeUser(action.payload?.user ?? action.payload);
            })
            .addCase(updateUser.pending, (state) => {
                state.updateUserLoading = true;
                state.updateUserError = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.user = action.payload?.user ? normalizeUser(action.payload.user) : state.user;
                state.updateUserLoading = false;
                state.updateUserError = null;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.updateUserLoading = false;
                state.updateUserError = getActionError(action);
            })
            .addCase(deleteUser.pending, (state) => {
                state.deleteUserLoading = true;
                state.deleteUserError = null;
            })
            .addCase(deleteUser.fulfilled, (state) => {
                state.user = null;
                state.deleteUserLoading = false;
                state.deleteUserError = null;
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.deleteUserLoading = false;
                state.deleteUserError = getActionError(action);
            });
    },
});

export const {setThemePreference} = userSlice.actions;

export const userReducer = userSlice.reducer;
