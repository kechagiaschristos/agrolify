import {createBrowserRouter} from 'react-router-dom';
import routePaths from './routePaths.json';
import ProtectedRoutes from './ProtectedRoutes.jsx';
import ProtectedLayout from './ProtectedLayout.jsx';
import Layout from "../../shared/layout/Layout.jsx";
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import lazyRoute from './lazyRoute.jsx';
import RouteHydrateFallback from './RouteHydrateFallback.jsx';

const router = createBrowserRouter([
    {
        hydrateFallbackElement: <RouteHydrateFallback />,
        children: [
            {
                element: <PublicOnlyRoute />,
                children: [
                    {
                        path: routePaths.home,
                        lazy: lazyRoute(() => import('../../features/home/pages/HomePage.jsx'), 'home'),
                    },
                    {
                        path: routePaths.login,
                        lazy: lazyRoute(() => import('../../features/auth/pages/AuthPage.jsx'), 'login'),
                    },
                    {
                        path: routePaths.register,
                        lazy: lazyRoute(() => import('../../features/auth/pages/AuthPage.jsx'), 'register'),
                    },
                ],
            },
            {
                element: <ProtectedLayout />,
                children: [
                    {
                        element: <Layout />,
                        children: ProtectedRoutes,
                    },
                ],
            },
            {
                path: '*',
                lazy: lazyRoute(() => import('../../features/error404/pages/Error404Page.jsx'), 'notFound'),
            },
        ],
    },
]);

export default router;
