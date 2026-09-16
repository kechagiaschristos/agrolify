import {Card, Empty, Flex, Grid} from 'antd';
import {useTranslation} from 'react-i18next';
import useWorkspaceData from './useWorkspaceData';
import ChartsSection from './ChartsSection';
import MetricsGrid from './MetricsGrid';
import appThemeConfig from '../../theme/appThemeConfig';

export default function WorkspacePage({identity: pageIdentity, buildWorkspacePage}) {
    const {t} = useTranslation();
    const {md} = Grid.useBreakpoint();
    const {
        snapshot,
        pageData,
        selectedPeriod,
        selectedDate,
        setSelectedPeriod,
        setSelectedDate,
        isLoadingSeries,
    } = useWorkspaceData({buildWorkspacePage, t});

    if (!snapshot) {
        return (
            <Card>
                <Empty description={t('routes.noSelectedDeviceTitle')} />
            </Card>
        );
    }

    return (
        <Flex
            vertical
            gap={appThemeConfig.card.spacing.rowGap}
            style={{
                width: '100%',
                height: md ? '100%' : 'auto',
                minHeight: 0,
                flex: md ? 1 : '0 0 auto',
            }}
        >
            <MetricsGrid metrics={pageData.summaryMetrics} pageIdentity={pageIdentity} />

            <ChartsSection
                pageIdentity={pageIdentity}
                pageData={pageData}
                selectedPeriod={selectedPeriod}
                selectedDate={selectedDate}
                onPeriodChange={setSelectedPeriod}
                onDateChange={setSelectedDate}
                isLoadingCharts={isLoadingSeries}
                noDataLabel={t('common.noData')}
            />
        </Flex>
    );
}
