import {Grid, Space, Tabs} from 'antd';
import {useTranslation} from 'react-i18next';
import appThemeConfig from '../../../../shared/theme/appThemeConfig.js';
import DangerZoneSection from './DangerZoneSection.jsx';
import EmailSection from './EmailSection.jsx';
import PasswordSection from './PasswordSection.jsx';
import PersonalInfoSection from './PersonalInfoSection.jsx';

const siteCardSpacing = appThemeConfig.card.spacing;

export default function UserSettings() {
    const {t} = useTranslation();
    const screens = Grid.useBreakpoint();

    const items = [
        {
            key: 'personal',
            label: t('account.personalInfoTab'),
            children: <PersonalInfoSection sectionGap={siteCardSpacing.sectionGap} />,
        },
        {
            key: 'email',
            label: t('account.emailTab'),
            children: <EmailSection sectionGap={siteCardSpacing.sectionGap} />,
        },
        {
            key: 'password',
            label: t('account.passwordTab'),
            children: <PasswordSection sectionGap={siteCardSpacing.sectionGap} />,
        },
        {
            key: 'danger',
            label: t('account.dangerZoneTab'),
            children: <DangerZoneSection sectionGap={siteCardSpacing.sectionGap} />,
        },
    ];

    return (
        <Space orientation="vertical" size={siteCardSpacing.rowGap} style={{width: '100%'}}>
            <div style={{width: '100%', maxWidth: 1040}}>
                <Tabs
                    className="profile-settings-tabs"
                    items={items}
                    tabPlacement={screens.lg ? 'left' : 'top'}
                    style={{width: '100%'}}
                    destroyOnHidden
                />
            </div>
        </Space>
    );
}
