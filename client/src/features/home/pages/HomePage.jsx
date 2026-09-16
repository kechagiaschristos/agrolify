import {
    ArrowRightOutlined,
    DeploymentUnitOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import {IoWaterOutline} from 'react-icons/io5';
import {MdAir} from 'react-icons/md';
import {
    Button,
    Card,
    Collapse,
    Flex,
    Grid,
    Layout as AntLayout,
    Space,
    Typography,
    theme,
} from 'antd';
import {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import routePaths from '../../../app/router/routePaths.json';
import Footer from '../../../shared/layout/Footer.jsx';
import PublicHeader from '../../../shared/layout/PublicHeader.jsx';
import {selectActiveTheme} from '../../profile/store/userSelectors.js';
import dashboardGraphsPreview from '../../../shared/assets/landing/dashboard-graphs-preview.svg';
import dashboardGraphsPreviewLight from '../../../shared/assets/landing/dashboard-graphs-preview-light.svg';

const {Content} = AntLayout;
const {Title, Paragraph, Text} = Typography;
const {useBreakpoint} = Grid;

const MAX_CONTENT_WIDTH = 1120;

const getFeatureItems = (t) => ([
    {key: 'monitoring', icon: <EyeOutlined />, title: t('landing.features.monitoring.title'), description: t('landing.features.monitoring.description')},
    {key: 'irrigation', icon: <IoWaterOutline />, title: t('landing.features.irrigation.title'), description: t('landing.features.irrigation.description')},
    {key: 'ventilation', icon: <MdAir />, title: t('landing.features.ventilation.title'), description: t('landing.features.ventilation.description')},
    {key: 'devices', icon: <DeploymentUnitOutlined />, title: t('landing.features.devices.title'), description: t('landing.features.devices.description')},
]);

const sectionStyle = (isMobile, isCompactMobile) => ({
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    margin: '0 auto',
    paddingInline: isCompactMobile ? 14 : isMobile ? 18 : 28,
});

const getSurfaceStyle = (token, isDarkTheme, isCompactMobile = false) => ({
    borderRadius: isCompactMobile ? 22 : 32,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: isDarkTheme ? 'rgba(20, 24, 31, 0.82)' : 'rgba(255, 255, 255, 0.82)',
    boxShadow: isCompactMobile
        ? (isDarkTheme ? '0 16px 44px rgba(0, 0, 0, 0.24)' : '0 16px 44px rgba(15, 23, 42, 0.08)')
        : (isDarkTheme ? '0 30px 80px rgba(0, 0, 0, 0.32)' : '0 30px 80px rgba(15, 23, 42, 0.1)'),
    backdropFilter: isCompactMobile ? 'blur(12px)' : 'blur(18px)',
});

const getGridStyle = (isCompactMobile, minWidth) => ({
    display: 'grid',
    gridTemplateColumns: isCompactMobile ? '1fr' : `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gap: isCompactMobile ? 12 : 16,
    width: '100%',
});

function HomePage() {
    const {token} = theme.useToken();
    const screens = useBreakpoint();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const activeTheme = useSelector(selectActiveTheme);

    const isDarkTheme = activeTheme === 'dark';
    const isMobile = !screens.md;
    const isCompactMobile = !screens.sm;
    const featureItems = getFeatureItems(t);
    const setupSteps = ['connect', 'configure', 'review'];
    const faqItems = ['hardware', 'automation', 'connection'].map((key) => ({
        key,
        label: t(`landing.faq.${key}.question`),
        children: <Paragraph style={{margin: 0}}>{t(`landing.faq.${key}.answer`)}</Paragraph>,
    }));
    const previewImage = isDarkTheme ? dashboardGraphsPreview : dashboardGraphsPreviewLight;
    const pageBackground = isDarkTheme
        ? 'radial-gradient(circle at 50% 0%, rgba(15, 159, 110, 0.18), rgba(15, 17, 21, 1) 40%)'
        : 'radial-gradient(circle at 50% 0%, rgba(226, 244, 235, 0.9), #f5f7fb 42%)';

    useEffect(() => {
        const {documentElement, body} = document;
        const previousHtmlOverflow = documentElement.style.overflow;
        const previousBodyOverflow = body.style.overflow;

        documentElement.style.overflow = 'auto';
        body.style.overflow = 'auto';

        return () => {
            documentElement.style.overflow = previousHtmlOverflow;
            body.style.overflow = previousBodyOverflow;
        };
    }, []);

    return (
        <AntLayout
            style={{
                minHeight: '100dvh',
                background: pageBackground,
            }}
        >
            <PublicHeader />

            <Content style={{flex: 1, minWidth: 0, overflowX: 'hidden'}}>
                <section
                    style={{
                        ...sectionStyle(isMobile, isCompactMobile),
                        paddingBlock: isCompactMobile ? '34px 20px' : isMobile ? '48px 30px' : '112px 78px',
                    }}
                >
                    <Flex vertical align="center" gap={isCompactMobile ? 18 : 26} style={{textAlign: 'center'}}>
                        <Text strong style={{color: token.colorPrimary}}>{t('landing.eyebrow')}</Text>
                        <Title
                            level={1}
                            style={{
                                margin: 0,
                                maxWidth: isCompactMobile ? 360 : isMobile ? 760 : 1080,
                                fontSize: token.fontSizeHeading1,
                                lineHeight: 1.02,
                                letterSpacing: 0,
                                fontWeight: 850,
                                textWrap: 'balance',
                            }}
                        >
                            {t('landing.heroTitle')}
                        </Title>
                        <Paragraph
                            style={{
                                margin: 0,
                                maxWidth: isCompactMobile ? 360 : 650,
                                color: token.colorTextSecondary,
                                fontSize: token.fontSizeLG,
                                lineHeight: 1.5,
                                textWrap: 'pretty',
                            }}
                        >
                            {t('landing.heroDescription')}
                        </Paragraph>
                        <Flex gap={12} wrap justify="center">
                            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate(routePaths.login)}>
                                {t('landing.demoAction')}
                            </Button>
                            <Button size="large" href="#how-it-works">{t('landing.howItWorksAction')}</Button>
                        </Flex>
                        <Text type="secondary" style={{maxWidth: 560}}>{t('landing.demoNote')}</Text>
                    </Flex>
                </section>

                <section
                    style={{
                        ...sectionStyle(isMobile, isCompactMobile),
                        paddingBlock: isCompactMobile ? '10px 22px' : isMobile ? 26 : 48,
                    }}
                >
                    <div style={getGridStyle(isCompactMobile, 210)}>
                        {featureItems.map((item) => (
                            <Card
                                key={item.key}
                                variant="borderless"
                                style={{...getSurfaceStyle(token, isDarkTheme, isCompactMobile), height: '100%'}}
                                styles={{body: {padding: isCompactMobile ? 18 : 22}}}
                            >
                                <Space orientation="vertical" size={8}>
                                    <Flex align="center" gap={10}>
                                        <Text
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: token.colorPrimary,
                                                fontSize: token.fontSizeHeading4,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {item.icon}
                                        </Text>
                                        <Text strong style={{fontSize: token.fontSizeLG, lineHeight: 1.22}}>
                                            {item.title}
                                        </Text>
                                    </Flex>
                                    <Text type="secondary">{item.description}</Text>
                                </Space>
                            </Card>
                        ))}
                    </div>
                </section>

                <section
                    style={{
                        ...sectionStyle(isMobile, isCompactMobile),
                        paddingBlock: isCompactMobile ? '4px 22px' : isMobile ? '10px 30px' : '4px 42px',
                    }}
                >
                    <div
                        style={{
                            ...getSurfaceStyle(token, isDarkTheme, isCompactMobile),
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{padding: isCompactMobile ? 18 : isMobile ? 22 : 30}}>
                            <Space orientation="vertical" size={8}>
                                <Title
                                    level={2}
                                    style={{
                                        margin: 0,
                                        fontSize: token.fontSizeHeading2,
                                        letterSpacing: 0,
                                        lineHeight: 1.08,
                                        textWrap: 'balance',
                                    }}
                                >
                                    {t('landing.preview.title')}
                                </Title>
                                <Paragraph
                                    style={{
                                        margin: 0,
                                        maxWidth: 620,
                                        color: token.colorTextSecondary,
                                        fontSize: token.fontSize,
                                    }}
                                >
                                    {t('landing.preview.description')}
                                </Paragraph>
                            </Space>
                        </div>
                        <figure style={{margin: 0}}>
                            <img
                                src={previewImage}
                                alt={t('landing.preview.dashboardAlt')}
                                width={1120}
                                height={650}
                                loading="lazy"
                                style={{display: 'block', width: '100%', height: 'auto'}}
                            />
                            <figcaption style={{padding: token.padding, color: token.colorTextSecondary, fontSize: token.fontSizeSM}}>
                                {t('landing.preview.caption')}
                            </figcaption>
                        </figure>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    aria-labelledby="setup-title"
                    style={{...sectionStyle(isMobile, isCompactMobile), paddingBlock: isMobile ? 32 : 56, scrollMarginTop: 90}}
                >
                    <Title id="setup-title" level={2} style={{marginTop: 0, textWrap: 'balance'}}>
                        {t('landing.setup.title')}
                    </Title>
                    <Paragraph type="secondary" style={{maxWidth: 650}}>{t('landing.setup.description')}</Paragraph>
                    <ol style={{...getGridStyle(isCompactMobile, 260), padding: 0, marginBlock: token.marginLG, listStyle: 'none'}}>
                        {setupSteps.map((key, index) => (
                            <li key={key} style={{borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: token.paddingLG}}>
                                <Text strong style={{color: token.colorPrimary, fontSize: token.fontSizeHeading3}}>
                                    {String(index + 1).padStart(2, '0')}
                                </Text>
                                <Title level={3} style={{fontSize: token.fontSizeHeading4, marginBlock: token.marginSM}}>
                                    {t(`landing.setup.${key}.title`)}
                                </Title>
                                <Paragraph type="secondary">{t(`landing.setup.${key}.description`)}</Paragraph>
                            </li>
                        ))}
                    </ol>
                </section>

                <section
                    aria-labelledby="faq-title"
                    style={{...sectionStyle(isMobile, isCompactMobile), paddingBlock: isMobile ? 24 : 40}}
                >
                    <Title id="faq-title" level={2} style={{marginTop: 0}}>{t('landing.faq.title')}</Title>
                    <Collapse items={faqItems} size="large" style={{background: token.colorBgContainer}} />
                </section>

                <section style={{...sectionStyle(isMobile, isCompactMobile), paddingBlock: isMobile ? '24px 40px' : '40px 72px'}}>
                    <Card
                        variant="borderless"
                        style={{background: token.colorPrimaryBg, border: `1px solid ${token.colorPrimaryBorder}`, borderRadius: token.borderRadiusLG}}
                        styles={{body: {padding: isMobile ? token.paddingLG : token.paddingXL, textAlign: 'center'}}}
                    >
                        <Title level={2} style={{marginTop: 0, textWrap: 'balance'}}>{t('landing.cta.title')}</Title>
                        <Paragraph style={{maxWidth: 620, marginInline: 'auto'}}>{t('landing.cta.description')}</Paragraph>
                        <Flex gap={12} wrap justify="center">
                            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate(routePaths.login)}>
                                {t('landing.demoAction')}
                            </Button>
                            <Button size="large" onClick={() => navigate(routePaths.register)}>
                                {t('landing.cta.registerAction')}
                            </Button>
                        </Flex>
                    </Card>
                </section>

                <Footer topGap={0} />
            </Content>
        </AntLayout>
    );
}

export default HomePage;
