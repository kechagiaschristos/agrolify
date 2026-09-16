import {useState} from 'react';
import {Card, Col, Row} from 'antd';
import {useSelector} from 'react-redux';
import appThemeConfig from '../../../shared/theme/appThemeConfig';
import AvatarModal from '../components/AvatarModal.jsx';
import ProfileHeader from '../components/ProfileHeader.jsx';
import UserSettings from '../components/userSettings/index.jsx';
import {selectCurrentUser} from '../store/userSelectors';

const siteCardSpacing = appThemeConfig.card.spacing;

const Profile = () => {
    const [modal, setModal] = useState(false);
    const user = useSelector(selectCurrentUser);
    return (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
            <Row gutter={[siteCardSpacing.rowGap, siteCardSpacing.rowGap]}>
                <Col span={24}>
                    <ProfileHeader user={user} onAvatarClick={() => setModal(true)} />
                    <AvatarModal modal={modal} closeModal={() => setModal(false)} />
                </Col>
            </Row>

            <Row gutter={[siteCardSpacing.rowGap, siteCardSpacing.rowGap]}>
                <Col span={24}>
                    <Card style={{width: '100%'}}>
                        <UserSettings />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
