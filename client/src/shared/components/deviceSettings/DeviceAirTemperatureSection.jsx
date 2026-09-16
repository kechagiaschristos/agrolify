import {Col, Form, InputNumber, Row} from 'antd';
import SettingsSection from './SettingsSection.jsx';
import appThemeConfig from '../../theme/appThemeConfig';

const DeviceAirTemperatureSection = ({t}) => (
    <SettingsSection
        title={t('deviceSettings.airTemperatureAutomationLabel')}
        tooltip={t('deviceSettings.airTemperatureAutomationTooltip')}
    >
        <Row gutter={[appThemeConfig.card.spacing.sectionGap, 0]}>
            <Col xs={24} md={12}>
                <Form.Item
                    name="minAirTemperature"
                    label={t('deviceSettings.minimumLabel')}
                    rules={[{required: true, message: t('deviceSettings.validationMinimumRequired')}]}
                    style={{marginBottom: 0}}
                >
                    <InputNumber style={{width: '100%'}} placeholder={t('deviceSettings.minimumLabel')}/>
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="maxAirTemperature"
                    label={t('deviceSettings.maximumLabel')}
                    dependencies={['minAirTemperature']}
                    rules={[
                        {required: true, message: t('deviceSettings.validationMaximumRequired')},
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                const min = getFieldValue('minAirTemperature');
                                if (value === undefined || min === undefined || Number(value) > Number(min)) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(new Error(t('deviceSettings.validationMaximumGreater')));
                            },
                        }),
                    ]}
                    style={{marginBottom: 0}}
                >
                    <InputNumber style={{width: '100%'}} placeholder={t('deviceSettings.maximumLabel')}/>
                </Form.Item>
            </Col>
        </Row>
    </SettingsSection>
);

export default DeviceAirTemperatureSection;
