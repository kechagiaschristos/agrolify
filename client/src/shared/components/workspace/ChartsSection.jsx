import dayjs from 'dayjs';
import {Card, ConfigProvider, DatePicker, Flex, Grid, Segmented, Space, theme, Typography} from 'antd';
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {useTranslation} from 'react-i18next';
import appThemeConfig from '../../theme/appThemeConfig';

const cardSpacing = appThemeConfig.card.spacing;
const getCardShellStyle = appThemeConfig.card.styles.shell;
const getCardTooltipStyle = appThemeConfig.card.styles.tooltip;

function getPanelBorderStyle(index, chartCount, showTwoColumns, token) {
    if (showTwoColumns) {
        return index % 2 === 0
            ? {borderTopRightRadius: 0, borderBottomRightRadius: 0}
            : {borderTopLeftRadius: 0, borderBottomLeftRadius: 0};
    }

    if (chartCount > 1) {
        const r = token.borderRadiusLG;
        return {
            borderRadius: 0,
            ...(index === 0 ? {borderTopLeftRadius: r, borderTopRightRadius: r} : {}),
            ...(index === chartCount - 1 ? {borderBottomLeftRadius: r, borderBottomRightRadius: r} : {}),
        };
    }

    return {};
}

function ChartTooltip({active, payload, label, panel, token}) {
    if (!active || !payload?.length) {
        return null;
    }

    const value = payload[0]?.value;
    const formattedValue = typeof panel.tooltipValueFormatter === 'function'
        ? panel.tooltipValueFormatter(value)
        : `${value}${panel.unit ? ` ${panel.unit}` : ''}`;

    return (
        <div style={getCardTooltipStyle(token)}>
            <div style={{fontSize: token.fontSizeSM, fontWeight: 600, color: token.colorText}}>
                {dayjs(label).format(panel.tooltipFormat || 'DD MMM YYYY, HH:mm')}
            </div>
            <div style={{fontSize: token.fontSizeSM, color: token.colorTextSecondary}}>
                {formattedValue}
            </div>
        </div>
    );
}

function ChartPanel({panel, noDataLabel, defaultChartHeight, fillHeight = false}) {
    const {token} = theme.useToken();
    const {md} = Grid.useBreakpoint();
    const isMobile = !md;
    const series = (panel.series ?? []).filter(({x, y}) => x && Number.isFinite(y));
    const chartMinHeight = panel.height || defaultChartHeight;
    const chartSurfaceOffset = isMobile ? 10 : 0;
    const yAxisWidth = panel.yAxisMobileWidth ?? panel.yAxisWidth ?? (isMobile ? 42 : undefined);
    const formatAxisValue = (value) => typeof panel.axisValueFormatter === 'function'
        ? panel.axisValueFormatter(value)
        : `${value}${panel.unit ? ` ${panel.unit}` : ''}`;

    return (
        <Flex vertical gap={cardSpacing.rowGap} style={{width: '100%', minHeight: 0, ...(fillHeight ? {height: '100%'} : {})}}>
            <Space orientation="vertical" size={4}>
                <Typography.Title level={4} style={{margin: 0}}>{panel.title}</Typography.Title>
                <Typography.Text type="secondary">{panel.subtitle}</Typography.Text>
            </Space>
            <div
                className="workspace-chart-surface"
                style={{
                    outline: 'none',
                    width: chartSurfaceOffset ? `calc(100% + ${chartSurfaceOffset}px)` : '100%',
                    minWidth: 0,
                    display: 'flex',
                    marginInlineStart: chartSurfaceOffset ? -chartSurfaceOffset : 0,
                    ...(fillHeight ? {flex: 1, minHeight: chartMinHeight} : {height: chartMinHeight}),
                }}
                onMouseDown={(event) => event.preventDefault()}
            >
                {!series.length ? (
                    <Flex align="center" justify="center" style={{width: '100%', height: '100%'}}>
                        <Typography.Text type="secondary">{noDataLabel}</Typography.Text>
                    </Flex>
                ) : (
                    <div style={{width: '100%', height: '100%'}}>
                        <ResponsiveContainer width="100%" height="100%" initialDimension={{width: 400, height: 300}}>
                            <AreaChart data={series} margin={{top: 0, right: isMobile ? 4 : 8, bottom: 0, left: isMobile ? -6 : 0}}>
                                <defs>
                                    <linearGradient id={`workspace-gradient-${panel.key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={panel.color} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={panel.color} stopOpacity={0.04} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={token.colorBorderSecondary} />
                                <XAxis
                                    dataKey="x"
                                    ticks={panel.xAxisInterval === 0 ? series.map(({x}) => x) : undefined}
                                    tick={{fill: token.colorTextTertiary, fontSize: token.fontSizeSM}}
                                    tickFormatter={(value) => dayjs(value).format(panel.axisFormat || 'DD MMM')}
                                    interval={panel.xAxisInterval}
                                    minTickGap={panel.xAxisMinTickGap}
                                    angle={panel.xAxisAngle}
                                    textAnchor={panel.xAxisTextAnchor}
                                    height={panel.xAxisHeight}
                                    padding={panel.xAxisPadding}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    width={yAxisWidth}
                                    tick={{fill: token.colorTextTertiary, fontSize: token.fontSizeSM}}
                                    tickFormatter={formatAxisValue}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<ChartTooltip panel={panel} token={token} />} />
                                <Area type="monotone" dataKey="y" stroke={panel.color} strokeWidth={3} fill={`url(#workspace-gradient-${panel.key})`} dot={false} activeDot={{r: 4}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </Flex>
    );
}

export default function ChartsSection({pageIdentity, pageData, selectedPeriod, selectedDate, onPeriodChange, onDateChange, isLoadingCharts, noDataLabel}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const {md, lg, xl} = Grid.useBreakpoint();
    const isMobile = !md;
    const chartCount = pageData.chartPanels.length;
    const chartsFillAvailableHeight = xl;
    const showTwoColumnCharts = xl && chartCount > 1;
    const defaultChartHeight = chartCount === 1
        ? 'clamp(220px, 38vh, 340px)'
        : (lg ? 'clamp(220px, 28vh, 280px)' : 'clamp(220px, 32vh, 300px)');

    const filterTheme = {
        components: {
            Segmented: {
                trackBg: token.colorBgBase === '#000' ? token.colorFillTertiary : pageIdentity.segmentedBackground,
                itemColor: token.colorTextSecondary,
                itemHoverColor: token.colorText,
                itemSelectedBg: token.colorBgContainer,
                itemSelectedColor: token.colorText,
            },
            DatePicker: {
                activeBorderColor: token.colorPrimary,
                hoverBorderColor: token.colorPrimaryHover,
            },
        },
    };

    return (
        <Card
            variant="borderless"
            style={{...getCardShellStyle(token), minHeight: 0, ...(chartsFillAvailableHeight ? {flex: 1} : {height: 'auto'})}}
            styles={{body: {padding: 0, display: 'flex', flexDirection: 'column', ...(chartsFillAvailableHeight ? {height: '100%'} : {})}}}
        >
            <Flex vertical style={{width: '100%', minHeight: 0, ...(chartsFillAvailableHeight ? {flex: 1} : {})}}>
                <ConfigProvider theme={filterTheme}>
                    <div style={{padding: cardSpacing.padding}}>
                        <Flex
                            vertical={isMobile}
                            align={isMobile ? 'flex-start' : 'center'}
                            wrap={isMobile ? false : 'wrap'}
                            gap={isMobile ? 8 : cardSpacing.sectionGap}
                            style={{minWidth: 0, width: isMobile ? '100%' : undefined}}
                        >
                            <Segmented
                                size="middle"
                                shape="round"
                                options={['day', 'week', 'month', 'year'].map((value) => ({value, label: t(`workspace.periods.${value}`)}))}
                                value={selectedPeriod}
                                onChange={onPeriodChange}
                                style={{width: isMobile ? 'fit-content' : undefined, maxWidth: '100%', minWidth: 0, order: isMobile ? 1 : 0}}
                            />
                            <DatePicker
                                allowClear={false}
                                picker={selectedPeriod === 'day' ? 'date' : selectedPeriod}
                                value={dayjs(selectedDate)}
                                onChange={(value) => onDateChange(value ? value.toDate() : new Date())}
                                size="middle"
                                style={{width: isMobile ? 176 : undefined, maxWidth: '100%', flex: isMobile ? undefined : '0 0 auto', order: isMobile ? 0 : 1}}
                            />
                        </Flex>
                    </div>
                </ConfigProvider>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: showTwoColumnCharts ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr',
                        rowGap: showTwoColumnCharts ? cardSpacing.rowGap : 0,
                        width: '100%',
                        minWidth: 0,
                        minHeight: 0,
                        alignItems: 'stretch',
                        ...(chartsFillAvailableHeight ? {flex: 1} : {}),
                    }}
                >
                    {pageData.chartPanels.map((panel, index) => (
                        <div
                            key={panel.key}
                            style={{
                                ...getCardShellStyle(token),
                                ...getPanelBorderStyle(index, chartCount, showTwoColumnCharts, token),
                                padding: cardSpacing.padding,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0,
                                minWidth: 0,
                                ...(chartsFillAvailableHeight ? {flex: 1} : {height: 'auto'}),
                            }}
                        >
                            <ChartPanel
                                panel={panel}
                                noDataLabel={isLoadingCharts ? t('workspace.loadingChart') : noDataLabel}
                                defaultChartHeight={defaultChartHeight}
                                fillHeight={chartsFillAvailableHeight}
                            />
                        </div>
                    ))}
                </div>
            </Flex>
        </Card>
    );
}
