import {createSelector} from '@reduxjs/toolkit';
import {getErrorMessage} from '../../../shared/utils/utilsSelectors.js';
import {selectSelectedDeviceCode} from '../../profile/store/userSelectors.js';
import {selectFan} from '../../air/store/fansSelectors.js';
import {selectWateringSchedules} from '../../water/store/wateringSchedulesSelectors.js';
import {selectWindow} from '../../water/store/windowsSelectors.js';

const EMPTY_ARRAY = [];

const selectDevicesState = (state) => state.devices ?? {};

export const selectDevicesList = (state) => selectDevicesState(state).devices ?? EMPTY_ARRAY;

export const selectFetchDevicesLoading = (state) => (
    Boolean(selectDevicesState(state).fetchDevicesLoading || selectDevicesState(state).selectDeviceLoading)
);

export const selectHasFetchedDevices = (state) => (
    Boolean(selectDevicesState(state).hasFetchedDevices)
);

const selectFetchDevicesError = (state) => (
    selectDevicesState(state).fetchDevicesError ?? null
);

export const selectFetchDevicesErrorMessage = (state) => (
    getErrorMessage(selectFetchDevicesError(state))
);

export const selectUpdateDeviceLoading = (state) => (
    Boolean(selectDevicesState(state).updateDeviceLoading)
);

export const selectAttachDeviceLoading = (state) => (
    Boolean(selectDevicesState(state).attachDeviceLoading)
);

export const selectDeleteDeviceLoading = (state) => (
    Boolean(selectDevicesState(state).deleteDeviceLoading)
);

export const getDeviceCode = (device) => device?.code ?? null;

export const findDeviceByCode = (devices, deviceCode) => (
    (devices ?? EMPTY_ARRAY).find(
        (device) => String(getDeviceCode(device)) === String(deviceCode),
    ) ?? null
);

export const selectSelectedDevice = createSelector(
    [selectDevicesList, selectSelectedDeviceCode],
    (devices, selectedDeviceCode) => findDeviceByCode(devices, selectedDeviceCode),
);

export const selectSelectedDeviceDetails = createSelector(
    [
        selectSelectedDevice,
        selectFan,
        selectWindow,
        selectWateringSchedules,
    ],
    (device, fan, window, wateringSchedules) => (
        !device
            ? null
            : {
                ...device,
                settings: device,
                fan,
                window,
                wateringSchedules,
            }
    ),
);
