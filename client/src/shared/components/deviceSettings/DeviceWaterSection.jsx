import {Form, InputNumber} from 'antd';
import SettingsSection, {InfoLabel} from './SettingsSection.jsx';

const DeviceWaterSection = ({t}) => (
    <SettingsSection
        title={t('deviceSettings.sections.water.title')}
        tooltip={t('deviceSettings.sections.water.tooltip')}
    >
        <Form.Item
            label={<InfoLabel label={t('deviceSettings.waterTankCapacityLabel')} tooltip={t('deviceSettings.waterTankCapacityTooltip')} />}
            name="waterTankCapacityLiters"
            rules={[
                {required: true, message: t('deviceSettings.validationWaterTankCapacityRequired')},
                {
                    validator(_, value) {
                        if (value === undefined || Number(value) <= 0) {
                            return Promise.reject(new Error(t('deviceSettings.validationWaterTankCapacityPositive')));
                        }

                        return Promise.resolve();
                    },
                },
            ]}
            style={{marginBottom: 0}}
        >
            <InputNumber style={{width: 220}} min={1} placeholder={t('deviceSettings.waterTankCapacityPlaceholder')} />
        </Form.Item>
    </SettingsSection>
);

export default DeviceWaterSection;
