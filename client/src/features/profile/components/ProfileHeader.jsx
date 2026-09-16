import {UserOutlined} from '@ant-design/icons';
import {Avatar, Card, Space, theme, Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import appThemeConfig from '../../../shared/theme/appThemeConfig.js';

const {Paragraph, Text, Title} = Typography;
const siteCardSpacing = appThemeConfig.card.spacing;

export default function ProfileHeader({user, onAvatarClick}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    const headerBackground = [
        'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 36%, rgba(2,18,14,0.28) 100%)',
        'linear-gradient(122deg, rgba(187,247,208,0.18) 0%, rgba(187,247,208,0.04) 26%, transparent 26% 100%)',
        `linear-gradient(135deg, #04271f 0%, #066345 42%, ${token.colorPrimary} 72%, #1fd18c 100%)`,
    ].join(', ');

    return (
        <Card
            styles={{body: {padding: 0}}}
            style={{
                overflow: 'hidden',
                marginBottom: siteCardSpacing.rowGap,
                borderColor: 'rgba(15, 159, 110, 0.24)',
                boxShadow: '0 18px 44px rgba(2, 44, 34, 0.22)',
            }}
        >
            <div
                style={{
                    minHeight: 240,
                    background: headerBackground,
                    padding: 24,
                    display: 'flex',
                    alignItems: 'flex-end',
                    position: 'relative',
                    isolation: 'isolate',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -56px 90px rgba(2, 21, 17, 0.34)',
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: '-8%',
                        width: '52%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(236,253,245,0.28), rgba(110,231,183,0.08) 44%, rgba(4,120,87,0.12))',
                        clipPath: 'polygon(28% 0, 100% 0, 72% 100%, 0 100%)',
                        opacity: 0.78,
                        pointerEvents: 'none',
                        zIndex: -1,
                    }}
                />
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: [
                            'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
                            'linear-gradient(0deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
                        ].join(', '),
                        backgroundSize: '44px 44px',
                        maskImage: 'linear-gradient(90deg, rgba(0,0,0,0.52), rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.46))',
                        opacity: 0.42,
                        pointerEvents: 'none',
                        zIndex: -1,
                    }}
                />
                <div style={{width: '100%', position: 'relative', zIndex: 1}}>
                    <Space size={siteCardSpacing.padding} align="end" wrap>
                        <button
                            type="button"
                            onClick={onAvatarClick}
                            aria-label={t('profile.changeAvatar')}
                            style={{
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                borderRadius: token.borderRadiusLG,
                            }}
                        >
                            <Avatar
                                size={112}
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                style={{
                                    border: '4px solid rgba(255,255,255,0.88)',
                                    boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                                }}
                            />
                        </button>

                        <div style={{maxWidth: 720}}>
                            <Title level={2} style={{color: '#fff', marginBottom: 0}}>
                                {fullName}
                            </Title>
                            {user?.username && fullName ? (
                                <Text style={{display: 'block', color: 'rgba(255,255,255,0.78)', marginTop: -2, marginBottom: 5}}>
                                    @{user.username}
                                </Text>
                            ) : null}
                            <Paragraph style={{color: 'rgba(255,255,255,0.74)', margin: '12px 0 0'}}>
                                {t('profile.subtitle')}
                            </Paragraph>
                        </div>
                    </Space>
                </div>
            </div>
        </Card>
    );
}
