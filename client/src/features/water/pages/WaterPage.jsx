import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useSelector} from 'react-redux';
import WorkspacePage from '../../../shared/components/workspace/WorkspacePage';
import WaterScheduleDrawer from '../components/WaterScheduleDrawer';
import {createWaterPageBuilder} from '../utils/waterPageBuilder';
import {selectSelectedDeviceDetails} from '../../devices/store/devicesSelectors';

function WaterPage() {
    const selectedDevice = useSelector(selectSelectedDeviceDetails);
    const location = useLocation();
    const navigate = useNavigate();
    const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(
        () => new URLSearchParams(location.search).get('planner') === 'open',
    );

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        if (searchParams.get('planner') !== 'open') {
            return;
        }

        const openScheduleDrawer = window.setTimeout(() => setIsScheduleDrawerOpen(true), 0);
        searchParams.delete('planner');

        navigate(
            {
                pathname: location.pathname,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            },
            {replace: true},
        );

        return () => window.clearTimeout(openScheduleDrawer);
    }, [location.pathname, location.search, navigate]);

    return (
        <>
            <WorkspacePage
                identity={{
                    positiveColor: '#237b63',
                    negativeColor: '#c53f3f',
                    segmentedBackground: '#ebfbff',
                }}
                buildWorkspacePage={createWaterPageBuilder({openScheduleDrawer: () => setIsScheduleDrawerOpen(true)})}
            />

            <WaterScheduleDrawer
                open={isScheduleDrawerOpen}
                onClose={() => setIsScheduleDrawerOpen(false)}
                selectedDevice={selectedDevice}
            />
        </>
    );
}

export default WaterPage;
