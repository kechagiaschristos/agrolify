import {Button, Result} from 'antd';
import {WarningOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import routePaths from '../../../app/router/routePaths.json';

const Error404 = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();

    return (
        <Result
            status="404"
            title="404"
            icon={<WarningOutlined />}
            subTitle={t('errors.notFoundDescription')}
            extra={(
                <Button type="primary" onClick={() => navigate(routePaths.home)}>
                    {t('errors.backHome')}
                </Button>
            )}
        />
    );
};

export default Error404;

