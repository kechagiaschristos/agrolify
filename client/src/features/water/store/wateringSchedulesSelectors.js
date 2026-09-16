const EMPTY_ARRAY = [];

const selectWateringSchedulesState = (state) => state.wateringSchedules ?? {};

export const selectWateringSchedules = (state) => (
    selectWateringSchedulesState(state).schedules ?? EMPTY_ARRAY
);

export const selectFetchWateringSchedulesLoading = (state) => (
    Boolean(selectWateringSchedulesState(state).fetchWateringSchedulesLoading)
);
