import {getErrorMessage} from '../../../shared/utils/utilsSelectors.js';

const EMPTY_ARRAY = [];

const selectWateringLogsState = (state) => state.wateringLogs ?? {};

export const selectWateringLogs = (state) => selectWateringLogsState(state).data ?? EMPTY_ARRAY;

export const selectWateringLogsTotal = (state) => (
    selectWateringLogsState(state).total ?? 0
);

export const selectWateringLogsPage = (state) => (
    selectWateringLogsState(state).page ?? 1
);

export const selectFetchWateringLogsLoading = (state) => (
    Boolean(selectWateringLogsState(state).fetchWateringLogsLoading)
);

const selectFetchWateringLogsError = (state) => (
    selectWateringLogsState(state).fetchWateringLogsError ?? null
);

export const selectFetchWateringLogsErrorMessage = (state) => (
    getErrorMessage(selectFetchWateringLogsError(state))
);
