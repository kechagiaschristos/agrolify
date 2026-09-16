import {useDispatch, useSelector} from 'react-redux';
import {Alert, Avatar, Button, Flex, Modal, Space, Typography} from 'antd';
import {UserOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';
import {updateUser} from '../store/userSlice';
import AppAlert from '../../../shared/components/Alert.jsx';
import {
    selectCurrentUser,
    selectUpdateUserErrorMessage,
    selectUpdateUserLoading,
} from '../store/userSelectors';
import {avatarOptions} from '../../../shared/utils/avatarOptions.js';

const {Paragraph} = Typography;

export default function AvatarModal({modal, closeModal}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const user = useSelector(selectCurrentUser);
    const loading = useSelector(selectUpdateUserLoading);
    const error = useSelector(selectUpdateUserErrorMessage);

    const handleAvatarSelect = async (avatar) => {
        await dispatch(updateUser({data: {avatar: avatar.filename}})).unwrap();
        AppAlert.show({type: 'success', message: t('account.messages.avatarUpdated')});
        closeModal();
    };

    return (
        <Modal
            open={modal}
            onCancel={loading ? undefined : closeModal}
            footer={null}
            title={t('avatar.modalTitle')}
            centered
            closable={!loading}
            mask={{closable: !loading}}
        >
            <Paragraph type="secondary">
                {t('avatar.modalDescription')}
            </Paragraph>
            {error ? <Alert type="error" message={error} style={{marginBottom: 16}} /> : null}
            <Flex wrap gap={16} justify="center">
                {avatarOptions.map((avatar) => {
                    const active = user?.avatar === avatar.url;

                    return (
                        <Button
                            key={avatar.filename}
                            type={active ? 'primary' : 'default'}
                            onClick={() => handleAvatarSelect(avatar)}
                            loading={loading && active}
                            style={{height: 'auto', padding: 10}}
                        >
                            <Space orientation="vertical" size={0} align="center">
                                <Avatar size={72} src={avatar.url} icon={<UserOutlined />} />
                            </Space>
                        </Button>
                    );
                })}
            </Flex>
        </Modal>
    );
}
