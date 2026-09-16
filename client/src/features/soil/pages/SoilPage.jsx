import WorkspacePage from '../../../shared/components/workspace/WorkspacePage';
import {buildSoilPage} from '../utils/soilPageBuilder.jsx';

function SoilPage() {
    return (
        <WorkspacePage
            identity={{
                positiveColor: '#246b40',
                negativeColor: '#c23f3f',
                segmentedBackground: '#eef8ef',
            }}
            buildWorkspacePage={buildSoilPage}
        />
    );
}

export default SoilPage;
