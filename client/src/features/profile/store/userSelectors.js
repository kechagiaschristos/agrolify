import {getStoredThemePreference} from '../../../shared/storage/appStorage.js';
import {getErrorMessage} from '../../../shared/utils/utilsSelectors.js';

const selectUserState = (state) => state.user ?? {};

export const selectCurrentUser = (state) => selectUserState(state).user ?? null;
export const selectUpdateUserLoading = (state) => Boolean(selectUserState(state).updateUserLoading);
export const selectDeleteUserLoading = (state) => Boolean(selectUserState(state).deleteUserLoading);

export const selectUpdateUserErrorMessage = (state) => getErrorMessage(selectUserState(state).updateUserError);

export const selectDeleteUserErrorMessage = (state) => getErrorMessage(selectUserState(state).deleteUserError);

export const selectActiveTheme = (state) => (
    selectCurrentUser(state)?.theme ?? selectUserState(state).themePreference ?? getStoredThemePreference() ?? 'light'
);

export const selectSelectedDeviceCode = (state) => (
    selectCurrentUser(state)?.selected_device_code ?? null
);
