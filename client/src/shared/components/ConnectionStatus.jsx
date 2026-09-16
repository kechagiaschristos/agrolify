import {Alert} from 'antd';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {selectConnectionStatus} from '../../app/realtime/realtimeSelectors.js';

export default function ConnectionStatus() {
    const {t} = useTranslation();
    const status = useSelector(selectConnectionStatus);
    if (status === 'connected') return null;
    return <Alert banner showIcon role="status" type="warning" title={t(`connection.${status}`)} />;
}
