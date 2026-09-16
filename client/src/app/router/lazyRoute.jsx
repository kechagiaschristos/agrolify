import PageHelmet from '../../shared/components/PageHelmet.jsx';

const lazyRoute = (loader, pageKey) => async () => {
    const module = await loader();
    const RouteComponent = module.default;

    return {
        Component: function RouteWithHelmet() {
            return (
                <>
                    <PageHelmet pageKey={pageKey} />
                    <RouteComponent />
                </>
            );
        },
    };
};

export default lazyRoute;
