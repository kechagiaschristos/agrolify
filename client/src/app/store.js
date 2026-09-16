import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {createRequestGuard, selectedDeviceCode} from './requestGuard.js';
import {setApiContextProvider, setUnauthorizedHandler} from '../shared/api/axiosInstance.js';
import {clearUserState} from '../features/profile/store/userSlice.js';
import {realtimeReducer} from './realtime/realtimeSlice.js';
import {authReducer} from "../features/auth/store/authSlice.js";
import {devicesReducer} from "../features/devices/store/devicesSlice.js";
import {fansReducer} from "../features/air/store/fansSlice.js";
import {measurementsReducer} from "../features/measurements/store/measurementsSlice.js";
import {notificationsReducer} from "../features/notifications/store/notificationsSlice.js";
import {userReducer} from "../features/profile/store/userSlice.js";
import {wateringLogsReducer} from "../features/water/store/wateringLogsSlice.js";
import {wateringSchedulesReducer} from "../features/water/store/wateringSchedulesSlice.js";
import {windowsReducer} from "../features/water/store/windowsSlice.js";

const reducers = {
        auth: authReducer,
        devices: devicesReducer,
        fans: fansReducer,
        measurements: measurementsReducer,
        notifications: notificationsReducer,
        user: userReducer,
        wateringLogs: wateringLogsReducer,
        wateringSchedules: wateringSchedulesReducer,
        windows: windowsReducer,
        realtime: realtimeReducer,
};
const combinedReducer = combineReducers(reducers);
const deviceKeys = ['fans', 'windows', 'measurements', 'wateringSchedules', 'wateringLogs'];
const store = configureStore({
    reducer: (state, action) => {
        const nextState = combinedReducer(state, action);
        if (selectedDeviceCode(state) === selectedDeviceCode(nextState)) return nextState;
        return {
            ...nextState,
            ...Object.fromEntries(deviceKeys.map((key) => [key, reducers[key](undefined, {type: '@@INIT'})])),
        };
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(createRequestGuard()),
});

setUnauthorizedHandler(() => {
    if (store.getState().auth.isAuthenticated) store.dispatch(clearUserState());
});
setApiContextProvider(() => ({
    userId: store.getState().user.user?.id,
    deviceCode: selectedDeviceCode(store.getState()),
}));

export default store;
