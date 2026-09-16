import {InfoCircleOutlined} from '@ant-design/icons';
import {Card, Space, Tooltip, Typography, theme} from 'antd';
import appThemeConfig from '../../theme/appThemeConfig';

const infoIconStyle = {color: '#94a3b8', fontSize: 14, cursor: 'help'};

export const InfoLabel = ({label, tooltip}) => (
    <Space size={6}>
        {label}
        <Tooltip title={tooltip}>
            <InfoCircleOutlined style={infoIconStyle} />
        </Tooltip>
    </Space>
);

const SettingsSection = ({title, subtitle, tooltip, children}) => {
    const {token} = theme.useToken();

    return (
        <Card
            size="small"
            style={appThemeConfig.card.styles.shell(token)}
            styles={{body: {padding: appThemeConfig.card.spacing.padding}}}
        >
            <Space orientation="vertical" size={appThemeConfig.card.spacing.sectionGap} style={{width: '100%'}}>
                <div>
                    <Space size={6} align="center">
                        <Typography.Title level={5} style={{margin: 0}}>
                            {title}
                        </Typography.Title>
                        {tooltip ? (
                            <Tooltip title={tooltip}>
                                <InfoCircleOutlined style={infoIconStyle} />
                            </Tooltip>
                        ) : null}
                    </Space>
                    {subtitle ? (
                        <Typography.Text type="secondary" style={{display: 'block', marginTop: 4}}>
                            {subtitle}
                        </Typography.Text>
                    ) : null}
                </div>
                {children}
            </Space>
        </Card>
    );
};

export default SettingsSection;
