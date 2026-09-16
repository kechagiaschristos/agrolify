import {ArrowDownOutlined, ArrowUpOutlined, ClockCircleOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {Card, Flex, Grid, Progress, Space, Statistic, theme, Tooltip, Typography} from 'antd';
import appThemeConfig from '../../theme/appThemeConfig';

const cardSpacing = appThemeConfig.card.spacing;
const getCardShellStyle = appThemeConfig.card.styles.shell;

function InfoTooltip({title, token}) {
    if (!title) return null;
    return (
        <Tooltip title={title}>
            <InfoCircleOutlined style={{color: token.colorTextTertiary, fontSize: token.fontSize, cursor: 'help'}} />
        </Tooltip>
    );
}

function MetricCard({metric, pageIdentity}) {
    const {token} = theme.useToken();
    const trendIcon = metric.trend > 0 ? <ArrowUpOutlined /> : metric.trend < 0 ? <ArrowDownOutlined /> : <ClockCircleOutlined />;
    const trendColor = metric.trend > 0 ? pageIdentity.positiveColor : metric.trend < 0 ? pageIdentity.negativeColor : '#6b7280';

    return (
        <Card
            variant="borderless"
            style={getCardShellStyle(token)}
            styles={metric.type === 'custom' ? {body: {height: '100%'}} : undefined}
        >
            {metric.type === 'custom' ? (
                <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {metric.title && (
                        <Flex align="center" gap={6}>
                            <Typography.Title level={4} style={{margin: 0}}>{metric.title}</Typography.Title>
                            <InfoTooltip title={metric.subtitle} token={token} />
                        </Flex>
                    )}
                    <div style={{flex: 1, minHeight: 0, marginTop: cardSpacing.rowGap}}>
                        {metric.render?.() || null}
                    </div>
                </div>
            ) : (
                <Space orientation="vertical" size={cardSpacing.rowGap} style={{width: '100%'}}>
                    <Space orientation="vertical" size={6}>
                        <Flex align="center" gap={6}>
                            <Typography.Text type="secondary">{metric.label}</Typography.Text>
                            <InfoTooltip title={metric.infoTooltip} token={token} />
                        </Flex>
                        <Statistic value={metric.value} suffix={metric.suffix} precision={metric.precision ?? 0} styles={{content: {fontSize: token.fontSizeHeading3, lineHeight: 1.1}}} />
                    </Space>
                    <Flex justify="space-between" align="center" gap={12}>
                        <Typography.Text strong style={{color: trendColor, whiteSpace: 'nowrap', flexShrink: 0}}>
                            {trendIcon} {metric.trendLabel}
                        </Typography.Text>
                    </Flex>
                    <Progress percent={Math.max(0, Math.min(metric.progress ?? 0, 100))} showInfo={false} strokeColor={metric.progressColor} railColor={token.colorFillSecondary} strokeLinecap="round" />
                    <Typography.Text type="secondary">{metric.helper}</Typography.Text>
                </Space>
            )}
        </Card>
    );
}

export default function MetricsGrid({metrics, pageIdentity}) {
    const {md, lg} = Grid.useBreakpoint();

    return !metrics.length ? null : (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: lg
                    ? `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))`
                    : 'repeat(2, minmax(0, 1fr))',
                gap: cardSpacing.rowGap,
                width: '100%',
                minWidth: 0,
            }}
        >
            {metrics.map((metric) => (
                <div
                    key={metric.key}
                    style={{
                        display: 'flex',
                        minWidth: 0,
                        ...(!md && (metric.type === 'custom' || metric.mobileFullWidth) ? {gridColumn: '1 / -1'} : {}),
                    }}
                >
                    <MetricCard metric={metric} pageIdentity={pageIdentity} />
                </div>
            ))}
        </div>
    );
}
