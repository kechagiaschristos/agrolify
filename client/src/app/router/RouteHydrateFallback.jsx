import {Spin} from 'antd';

function RouteHydrateFallback() {
    return (
        <div style={{display: 'flex', justifyContent: 'center', padding: '48px 0'}}>
            <Spin size="large" />
        </div>
    );
}

export default RouteHydrateFallback;
