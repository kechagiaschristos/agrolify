import {DeleteOutlined} from '@ant-design/icons';
import {Button, Flex, Popconfirm} from 'antd';
import appThemeConfig from '../../theme/appThemeConfig';

const DeviceSettingsActions = ({
    deleteDeviceLoading,
    formLoading,
    onDelete,
    t,
}) => (
    <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={appThemeConfig.card.spacing.sectionGap}
        style={{
            marginTop: appThemeConfig.card.spacing.rowGap,
            width: '100%',
        }}
    >
        <Popconfirm
            title={t('deviceSettings.deleteDeviceTitle')}
            description={t('deviceSettings.deleteDeviceConfirm')}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            okButtonProps={{danger: true}}
            onConfirm={onDelete}
        >
            <Button danger icon={<DeleteOutlined/>} loading={deleteDeviceLoading}>
                {t('deviceSettings.deleteDeviceTitle')}
            </Button>
        </Popconfirm>
        <Button type="primary" htmlType="submit" loading={formLoading}>
            {t('common.save')}
        </Button>
    </Flex>
);

export default DeviceSettingsActions;
