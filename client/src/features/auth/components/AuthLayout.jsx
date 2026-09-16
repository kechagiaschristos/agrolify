import {Alert, Card, Flex, Space, Typography, theme} from 'antd';

const {Title} = Typography;
const {useToken} = theme;

const AuthLayout = ({
    activeMode,
    header,
    isMobile,
    loginForm,
    loginTitle,
    registerForm,
    registerTitle,
    serverWakeNotice,
}) => {
    const {token: themeToken} = useToken();
    const isDarkTheme = themeToken.colorBgBase === '#000';
    const pageStyle = {
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkTheme
            ? 'radial-gradient(circle at 50% 0%, rgba(15, 159, 110, 0.24) 0%, rgba(15, 17, 21, 0.98) 38%, rgba(10, 12, 16, 1) 100%)'
            : 'radial-gradient(circle at 50% 0%, rgba(226, 244, 235, 0.9), #f5f7fb 42%)',
    };
    const contentStyle = {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isMobile ? 12 : 16,
        boxSizing: 'border-box',
    };
    const cardStyle = {
        width: '100%',
        marginBlock: 'auto',
        maxWidth: isMobile ? 420 : 460,
        background: isDarkTheme ? 'rgba(20, 24, 31, 0.9)' : 'rgba(255, 255, 255, 0.88)',
        boxShadow: isDarkTheme ? '0 32px 80px rgba(0, 0, 0, 0.38)' : '0 32px 80px rgba(22, 46, 102, 0.18)',
        backdropFilter: 'blur(10px)',
    };
    const formBodyStyle = {
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
    };

    return (
        <div style={pageStyle}>
            {header}
            <Flex align="start" justify="center" style={contentStyle}>
                <Card
                    variant="borderless"
                    styles={{body: {padding: isMobile ? 24 : 40}}}
                    style={cardStyle}
                >
                    <div style={formBodyStyle}>
                        <Space orientation="vertical" size={20} style={{width: '100%'}}>
                            <Flex vertical align="center" gap={6}>
                                <Title level={2} style={{margin: 0, textAlign: 'center'}}>
                                    {activeMode === 'login' ? loginTitle : registerTitle}
                                </Title>
                            </Flex>
                            <Alert type="info" showIcon title={serverWakeNotice} />
                            {activeMode === 'login' ? loginForm : registerForm}
                        </Space>
                    </div>
                </Card>
            </Flex>
        </div>
    );
};

export default AuthLayout;
