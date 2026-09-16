import WorkspacePage from '../../../shared/components/workspace/WorkspacePage';
import {createAirPageBuilder} from '../utils/airPageBuilder';

function Air({focusMetric = 'temperature'}) {
    return (
        <WorkspacePage
            identity={{
                positiveColor: '#1d7a4d',
                negativeColor: '#d14343',
                segmentedBackground: '#fff3ee',
            }}
            buildWorkspacePage={createAirPageBuilder(focusMetric)}
        />
    );
}

export default Air;
