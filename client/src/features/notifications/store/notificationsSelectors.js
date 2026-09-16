import {getErrorMessage} from '../../../shared/utils/utilsSelectors.js';

const EMPTY_ARRAY = [];

const selectNotificationsState = (state) => state.notifications ?? {};

export const selectNotifications = (state) => selectNotificationsState(state).data ?? EMPTY_ARRAY;

export const selectFetchNotificationsLoading = (state) => (
    Boolean(selectNotificationsState(state).fetchNotificationsLoading)
);

export const selectDeleteNotificationLoading = (state) => (
    Boolean(selectNotificationsState(state).deleteNotificationLoading)
);

export const selectUpdateNotificationLoading = (state) => (
    Boolean(selectNotificationsState(state).updateNotificationLoading)
);

const selectFetchNotificationsError = (state) => (
    selectNotificationsState(state).fetchNotificationsError ?? null
);

const selectUpdateNotificationError = (state) => (
    selectNotificationsState(state).updateNotificationError ?? null
);

const selectDeleteNotificationError = (state) => (
    selectNotificationsState(state).deleteNotificationError ?? null
);

export const selectFetchNotificationsErrorMessage = (state) => (
    getErrorMessage(selectFetchNotificationsError(state))
);

export const selectDeleteNotificationErrorMessage = (state) => (
    getErrorMessage(selectDeleteNotificationError(state))
);

export const selectUpdateNotificationErrorMessage = (state) => (
    getErrorMessage(selectUpdateNotificationError(state))
);

export const selectNotificationsTotal = (state) => (
    selectNotificationsState(state).total ?? 0
);

const selectNotificationsUnreadTotal = (state) => (
    selectNotificationsState(state).unreadTotal ?? null
);

export const selectHasFetchedNotifications = (state) => (
    Boolean(selectNotificationsState(state).hasFetched)
);

export const selectUnreadNotificationCount = (state) => (
    selectNotificationsUnreadTotal(state)
    ?? selectNotifications(state).filter((notification) => !notification?.is_read).length
);
