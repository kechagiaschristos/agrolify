const selectFansState = (state) => state.fans ?? {};

export const selectFan = (state) => selectFansState(state).fan ?? null;

export const selectFetchFansLoading = (state) => (
    Boolean(selectFansState(state).fetchFansLoading)
);
