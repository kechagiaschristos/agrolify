import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {API_BASE_URL} from '../../shared/api/axiosInstance.js';
import {checkAuth} from '../../features/auth/store/authSlice.js';
import {selectIsAuthenticated} from '../../features/auth/store/authSelectors.js';
import {selectSelectedDevice} from '../../features/devices/store/devicesSelectors.js';
import {loadSelectedDeviceData} from '../../features/devices/store/devicesSlice.js';
import {receiveLiveMeasurement} from '../../features/measurements/store/measurementsSlice.js';
import {receiveLiveFan} from '../../features/air/store/fansSlice.js';
import {receiveLiveWindow} from '../../features/water/store/windowsSlice.js';
import {receiveLiveNotification, receiveNotificationsSnapshot} from '../../features/notifications/store/notificationsSlice.js';
import {setConnectionStatus} from './realtimeSlice.js';

const cableUrl = new URL('/cable', API_BASE_URL);
cableUrl.protocol = cableUrl.protocol === 'https:' ? 'wss:' : 'ws:';

function Realtime() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceId = selectedDevice?.id;
    const selectedDeviceCode = selectedDevice?.code;

    useEffect(() => {
        if (!isAuthenticated) return;
        const measurementsChannel = selectedDeviceId
            ? JSON.stringify({channel: 'MeasurementsChannel', device_id: selectedDeviceId}) : null;
        const notificationsChannel = JSON.stringify({channel: 'NotificationsChannel'});
        const subscriptions = [notificationsChannel, measurementsChannel].filter(Boolean);
        let socket;
        let reconnectTimer;
        let heartbeatTimer;
        let disposed = false;
        let attempts = 0;
        let retryAllowed = true;

        const setStatus = (status) => {
            if (!disposed) dispatch(setConnectionStatus(status));
        };
        const connect = () => {
            window.clearTimeout(reconnectTimer);
            if (disposed || !retryAllowed) return;
            if (!navigator.onLine) {
                setStatus('offline');
                return;
            }
            setStatus(attempts ? 'reconnecting' : 'connecting');
            const currentSocket = new WebSocket(cableUrl.toString());
            socket = currentSocket;
            const confirmed = new Set();
            const renewHeartbeat = () => {
                window.clearTimeout(heartbeatTimer);
                heartbeatTimer = window.setTimeout(() => currentSocket.close(), 15000);
            };
            renewHeartbeat();
            currentSocket.onmessage = (event) => {
                if (disposed || socket !== currentSocket) return;
                renewHeartbeat();
                let data;
                try { data = JSON.parse(event.data); } catch { return; }
                if (data.type === 'welcome') {
                    subscriptions.forEach((identifier) => currentSocket.send(JSON.stringify({command: 'subscribe', identifier})));
                }
                if (data.type === 'confirm_subscription' && subscriptions.includes(data.identifier)) {
                    confirmed.add(data.identifier);
                    if (confirmed.size === subscriptions.length) {
                        attempts = 0;
                        setStatus('connected');
                        if (selectedDeviceCode) void dispatch(loadSelectedDeviceData(selectedDeviceCode));
                    }
                }
                if (data.type === 'reject_subscription' || (data.type === 'disconnect' && data.reconnect === false)) {
                    retryAllowed = false;
                    setStatus('unavailable');
                    currentSocket.close();
                    void dispatch(checkAuth());
                    return;
                }
                const message = data.message;
                if (!message) return;
                if (data.identifier === measurementsChannel) {
                    if (message.type === 'measurement.created') dispatch(receiveLiveMeasurement(message.measurement));
                    if (message.type === 'fan.updated') dispatch(receiveLiveFan(message.fan));
                    if (message.type === 'window.updated') dispatch(receiveLiveWindow(message.window));
                }
                if (data.identifier === notificationsChannel) {
                    if (message.type === 'notifications.snapshot') dispatch(receiveNotificationsSnapshot(message));
                    if (message.type === 'notification.created') dispatch(receiveLiveNotification(message));
                }
            };
            currentSocket.onclose = () => {
                window.clearTimeout(heartbeatTimer);
                if (disposed || !retryAllowed) return;
                attempts += 1;
                setStatus(navigator.onLine ? 'reconnecting' : 'offline');
                reconnectTimer = window.setTimeout(connect, Math.min(1000 * 2 ** Math.min(attempts, 5), 30000));
            };
        };
        const handleOffline = () => {
            setStatus('offline');
            socket?.close();
        };
        const handleOnline = () => {
            if (!socket || socket.readyState === WebSocket.CLOSED) connect();
        };
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        connect();
        return () => {
            disposed = true;
            window.clearTimeout(reconnectTimer);
            window.clearTimeout(heartbeatTimer);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            if (socket) {
                socket.onmessage = null;
                socket.onclose = null;
                if (socket.readyState === WebSocket.CONNECTING) {
                    socket.onopen = () => socket.close();
                } else {
                    socket.close();
                }
            }
        };
    }, [dispatch, isAuthenticated, selectedDeviceId, selectedDeviceCode]);
    return null;
}

export default Realtime;
