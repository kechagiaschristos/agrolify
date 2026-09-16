import {Layout, Typography, theme} from 'antd';
import {useTranslation} from 'react-i18next';

const currentYear = new Date().getFullYear();

const Footer = ({topGap = 0}) => {
    const {token} = theme.useToken();
    const {t} = useTranslation();

    return (
        <Layout.Footer
            style={{
                marginTop: topGap,
                flexShrink: 0,
                background: token.colorBgContainer,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                padding: 0,
                textAlign: 'center',
            }}
        >
            <div style={{padding: '8px 12px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))'}}>
                <Typography.Text type="secondary" style={{fontSize: 12, lineHeight: 1.4}}>
                    {'\u00A9'} {currentYear} {t('footer.designedAndDevelopedBy')}{' '}
                    <Typography.Link href="https://www.kechagiaschristos.com/" target="_blank" style={{fontSize: 'inherit'}}>
                        Kechagias Christos
                    </Typography.Link>
                </Typography.Text>
            </div>
        </Layout.Footer>
    );
};

export default Footer;
