const DEVICE_FEATURES = new Set(['fans', 'windows', 'measurements', 'wateringSchedules', 'wateringLogs']);

export const selectedDeviceCode = (state) => state?.user?.user?.selected_device_code ?? null;

// Keep responses from an old session, device, or chart query out of the store.
export const createRequestGuard = () => {
    let sessionVersion = 0;
    let deviceVersion = 0;
    const requests = new Map();
    const latestReads = new Map();

    return ({getState}) => (next) => (action) => {
        const [feature, operation, phase] = action.type.split('/');
        const requestId = action.meta?.requestId;
        const deviceScoped = DEVICE_FEATURES.has(feature);
        const readKey = operation?.startsWith('fetch') ? `${feature}/${operation}` : null;

        if (requestId && phase === 'pending') {
            requests.set(requestId, {sessionVersion, deviceVersion});
            if (readKey) latestReads.set(readKey, requestId);
        }

        if (requestId && (phase === 'fulfilled' || phase === 'rejected')) {
            const started = requests.get(requestId);
            requests.delete(requestId);
            if (!started || started.sessionVersion !== sessionVersion
                || (deviceScoped && started.deviceVersion !== deviceVersion)
                || (readKey && latestReads.get(readKey) !== requestId)) {
                return action;
            }
        }

        if (deviceScoped && operation?.startsWith('receiveLive')) {
            const state = getState();
            const selected = state.devices.devices.find((device) => device.code === selectedDeviceCode(state));
            if (!selected || String(action.payload?.device_id) !== String(selected.id)) return action;
            const liveRead = {fans: 'fetchFans', windows: 'fetchWindow', measurements: 'fetchLatestMeasurement'}[feature];
            if (liveRead) latestReads.delete(`${feature}/${liveRead}`);
        }

        const previousCode = selectedDeviceCode(getState());
        const result = next(action);
        if (action.type === 'user/clearUserState') sessionVersion += 1;
        if (previousCode !== selectedDeviceCode(getState())) deviceVersion += 1;
        return result;
    };
};
