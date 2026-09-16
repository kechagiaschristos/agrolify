const selectWindowsState = (state) => state.windows ?? {};

export const selectWindow = (state) => (
    selectWindowsState(state).window ?? null
);

export const selectFetchWindowLoading = (state) => (
    Boolean(selectWindowsState(state).fetchWindowLoading)
);
