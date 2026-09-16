import {createAction, createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
    deleteNotificationRequest,
    fetchNotificationsRequest,
    updateNotificationRequest,
} from './notificationsRequests.js';
import {clearUserState} from '../../profile/store/userSlice.js';

const getInitialState = () => ({
    data: [],
    total: 0,
    unreadTotal: 0,
    hasFetched: false,
    fetchNotificationsLoading: false,
    fetchNotificationsError: null,
    updateNotificationLoading: false,
    updateNotificationError: null,
    deleteNotificationLoading: false,
    deleteNotificationError: null,
});

const getActionError = (action) => action.payload ?? action.error?.message ?? null;
const requestFailedPayload = (error) => (
    error?.response?.data ?? {message: error?.message ?? 'Request failed'}
);

const sortNotificationsByCreatedAt = (notifications = []) => (
    [...notifications].sort((left, right) => {
        const leftTime = left?.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right?.created_at ? new Date(right.created_at).getTime() : 0;
        return rightTime - leftTime;
    })
);

const mergeNotifications = (currentNotifications = [], nextNotifications = []) => {
    const notificationsById = new Map();

    [...currentNotifications, ...nextNotifications].forEach((notification, index) => {
        const notificationKey = notification?.id ?? `notification-${index}`;
        notificationsById.set(notificationKey, notification);
    });

    return sortNotificationsByCreatedAt([...notificationsById.values()]);
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (params = {}, {rejectWithValue}) => {
        try {
            return (await fetchNotificationsRequest(params)).data;
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId, {rejectWithValue}) => {
        try {
            return {
                notificationId,
                data: (await deleteNotificationRequest(notificationId)).data,
            };
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markNotificationAsRead',
    async (notificationId, {rejectWithValue}) => {
        try {
            return {
                notificationId,
                data: (await updateNotificationRequest(notificationId)).data,
            };
        } catch (error) {
            return rejectWithValue(requestFailedPayload(error));
        }
    },
);

export const receiveLiveNotification = createAction(
    'notifications/receiveLiveNotification',
);

export const receiveNotificationsSnapshot = createAction(
    'notifications/receiveNotificationsSnapshot',
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: getInitialState(),
    extraReducers: (builder) => {
        builder
            .addCase(clearUserState, () => getInitialState())
            .addCase(fetchNotifications.pending, (state) => {
                state.fetchNotificationsLoading = true;
                state.fetchNotificationsError = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                const notifications = action.payload?.notifications ?? action.payload?.items ?? action.payload?.data ?? [];
                const page = Number(action.payload?.page) || 1;

                state.data = page > 1
                    ? mergeNotifications(state.data, notifications)
                    : sortNotificationsByCreatedAt(notifications);
                state.total =
                    action.payload?.total
                    ?? action.payload?.meta?.total
                    ?? state.data.length;
                state.unreadTotal =
                    action.payload?.unread_total
                    ?? action.payload?.meta?.unread_total
                    ?? state.data.filter((notification) => !notification?.is_read).length;
                state.hasFetched = true;
                state.fetchNotificationsLoading = false;
                state.fetchNotificationsError = null;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.hasFetched = true;
                state.fetchNotificationsLoading = false;
                state.fetchNotificationsError = getActionError(action);
            })
            .addCase(markNotificationAsRead.pending, (state) => {
                state.updateNotificationLoading = true;
                state.updateNotificationError = null;
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const updatedNotification = action.payload?.data?.notification;
                const previousNotification = state.data.find(
                    (notification) => notification?.id === action.payload.notificationId,
                );

                state.data = mergeNotifications(
                    state.data.filter(
                        (notification) => notification?.id !== action.payload.notificationId,
                    ),
                    updatedNotification ? [updatedNotification] : [],
                );
                state.unreadTotal = updatedNotification && !previousNotification?.is_read
                    ? Math.max(0, state.unreadTotal - 1)
                    : state.unreadTotal;
                state.hasFetched = true;
                state.updateNotificationLoading = false;
                state.updateNotificationError = null;
            })
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                state.updateNotificationLoading = false;
                state.updateNotificationError = getActionError(action);
            })
            .addCase(deleteNotification.pending, (state) => {
                state.deleteNotificationLoading = true;
                state.deleteNotificationError = null;
            })
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const deletedNotification = state.data.find(
                    (notification) => notification?.id === action.payload.notificationId,
                );

                state.data = state.data.filter(
                    (notification) => notification?.id !== action.payload.notificationId,
                );
                state.total =
                    action.payload?.data?.total
                    ?? Math.max(0, state.total - 1);
                state.unreadTotal =
                    action.payload?.data?.unread_total
                    ?? (
                        deletedNotification?.is_read
                            ? state.unreadTotal
                            : Math.max(0, state.unreadTotal - 1)
                    );
                state.hasFetched = true;
                state.deleteNotificationLoading = false;
                state.deleteNotificationError = null;
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.deleteNotificationLoading = false;
                state.deleteNotificationError = getActionError(action);
            })
            .addCase(receiveLiveNotification, (state, action) => {
                const liveNotification = action.payload?.notification ?? action.payload;
                const existingNotification = state.data.find(
                    (notification) => notification?.id === liveNotification?.id,
                );

                state.data = mergeNotifications(state.data, liveNotification ? [liveNotification] : []);
                state.total =
                    action.payload?.total
                    ?? (
                        existingNotification || !liveNotification
                            ? state.total
                            : state.total + 1
                    );
                state.unreadTotal =
                    action.payload?.unread_total
                    ?? state.data.filter((notification) => !notification?.is_read).length;
                state.hasFetched = true;
            })
            .addCase(receiveNotificationsSnapshot, (state, action) => {
                const notifications = action.payload?.notifications ?? [];

                state.data = sortNotificationsByCreatedAt(notifications);
                state.total =
                    action.payload?.total
                    ?? notifications.length;
                state.unreadTotal =
                    action.payload?.unread_total
                    ?? notifications.filter((notification) => !notification?.is_read).length;
                state.hasFetched = true;
            });
    },
});

export const notificationsReducer = notificationSlice.reducer;
