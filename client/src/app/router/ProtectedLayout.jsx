import {Spin} from 'antd';
import {useSelector} from 'react-redux';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import routePaths from './routePaths.json';
import {
    selectFetchDevicesLoading,
    selectHasFetchedDevices,
    selectSelectedDevice,
} from '../../features/devices/store/devicesSelectors.js';
import {selectSelectedDeviceCode} from '../../features/profile/store/userSelectors.js';
import {
    selectCheckAuthLoading,
    selectIsAuthenticated,
} from '../../features/auth/store/authSelectors.js';

function ProtectedLayout() {
    const location = useLocation();
    const checkAuthLoading = useSelector(selectCheckAuthLoading);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const fetchDevicesLoading = useSelector(selectFetchDevicesLoading);
    const hasFetchedDevices = useSelector(selectHasFetchedDevices);
    const selectedDeviceCode = useSelector(selectSelectedDeviceCode);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isDashboardRoute = location.pathname === routePaths.dashboard;
    const waitingForSelectedDevice = (
        isAuthenticated
        && !isDashboardRoute
        && Boolean(selectedDeviceCode)
        && (!hasFetchedDevices || (fetchDevicesLoading && !selectedDevice))
    );

    if (checkAuthLoading || waitingForSelectedDevice) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', padding: '48px 0'}}>
                <Spin size="large" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={routePaths.login} replace state={{from: location}} />;
    }

    if (!selectedDevice && !isDashboardRoute && hasFetchedDevices) {
        return <Navigate to={routePaths.dashboard} replace />;
    }

    return <Outlet />;
}

export default ProtectedLayout;
