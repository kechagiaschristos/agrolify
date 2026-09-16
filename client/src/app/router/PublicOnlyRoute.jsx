import {useSelector} from 'react-redux';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {selectIsAuthenticated} from '../../features/auth/store/authSelectors.js';
import routePaths from './routePaths.json';

const getRedirectPath = (locationState) => {
    const from = locationState?.from;

    if (!from?.pathname) {
        return routePaths.dashboard;
    }

    return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
};

function PublicOnlyRoute() {
    const location = useLocation();
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (isAuthenticated) {
        return <Navigate to={getRedirectPath(location.state)} replace />;
    }

    return <Outlet />;
}

export default PublicOnlyRoute;
