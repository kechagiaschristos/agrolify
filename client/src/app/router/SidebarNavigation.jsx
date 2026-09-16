import {MdAir, MdGrass, MdOutlineDashboard} from 'react-icons/md';
import {IoWaterOutline} from 'react-icons/io5';
import {FiMapPin} from 'react-icons/fi';
import routePaths from './routePaths.json';

const sidebarNavigation = [
    {
        titleKey: 'navigation.dashboard',
        key: routePaths.dashboard,
        icon: <MdOutlineDashboard />,
    },
    {
        titleKey: 'navigation.air',
        key: routePaths.air,
        icon: <MdAir />,
    },
    {
        titleKey: 'navigation.soil',
        key: routePaths.soil,
        icon: <MdGrass />,
    },
    {
        titleKey: 'navigation.water',
        key: routePaths.water,
        icon: <IoWaterOutline />,
    },
    {
        titleKey: 'navigation.map',
        key: routePaths.map,
        icon: <FiMapPin />,
    },
];

export default sidebarNavigation;
