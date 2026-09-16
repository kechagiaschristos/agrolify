import routePaths from './routePaths.json';
import lazyRoute from './lazyRoute.jsx';

const ProtectedRoutes = [
    {
        path: routePaths.dashboard,
        lazy: lazyRoute(() => import('../../features/dashboard/pages/DashboardPage.jsx'), 'dashboard'),
    },
    {
        path: routePaths.profile,
        lazy: lazyRoute(() => import('../../features/profile/pages/ProfilePage.jsx'), 'profile'),
    },
    {
        path: routePaths.air,
        lazy: lazyRoute(() => import('../../features/air/pages/AirPage.jsx'), 'air'),
    },
    {
        path: routePaths.soil,
        lazy: lazyRoute(() => import('../../features/soil/pages/SoilPage.jsx'), 'soil'),
    },
    {
        path: routePaths.water,
        lazy: lazyRoute(() => import('../../features/water/pages/WaterPage.jsx'), 'water'),
    },
    {
        path: routePaths.map,
        lazy: lazyRoute(() => import('../../features/maps/pages/MapsPage.jsx'), 'map'),
    },
];

export default ProtectedRoutes;
