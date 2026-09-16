const EMPTY_ARRAY = [];

export const selectMeasurementsState = (state) => state.measurements ?? {};

export const selectFetchLatestMeasurementLoading = (state) => (
    Boolean(selectMeasurementsState(state).fetchLatestMeasurementLoading)
);

export const selectLatestMeasurements = (state) => (
    selectMeasurementsState(state).latestMeasurement ?? EMPTY_ARRAY
);

export const selectLatestMeasurement = (state) => (
    selectLatestMeasurements(state)[0] ?? null
);
