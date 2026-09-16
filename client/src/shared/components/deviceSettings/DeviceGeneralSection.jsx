import {Col, Form, Input, Row, Select} from 'antd';
import SettingsSection, {InfoLabel} from './SettingsSection.jsx';
import appThemeConfig from '../../theme/appThemeConfig';

const TIME_ZONE_OPTIONS = Intl.supportedValuesOf('timeZone').map((value) => ({
    value,
    label: value.replaceAll('_', ' '),
}));

const DeviceGeneralSection = ({deviceCode, t}) => {
    const temperatureUnitOptions = [
        {value: 'cel', label: t('deviceSettings.temperatureUnitCelsius')},
        {value: 'fah', label: t('deviceSettings.temperatureUnitFahrenheit')},
    ];

    const liquidUnitOptions = [
        {value: 'liters', label: t('deviceSettings.liquidUnitLiters')},
        {value: 'gallons', label: t('deviceSettings.liquidUnitGallons')},
    ];

    return (
        <SettingsSection
            title={t('deviceSettings.sections.device.title')}
            subtitle={`${t('deviceSettings.deviceCodeLabel')}: ${deviceCode ?? '-'}`}
            tooltip={t('deviceSettings.sections.device.tooltip')}
        >
            <Form.Item
                label={<InfoLabel label={t('deviceSettings.deviceNameLabel')} tooltip={t('deviceSettings.deviceNameTooltip')} />}
                name="deviceName"
                rules={[{required: true, message: t('deviceSettings.validationDeviceNameRequired')}]}
                style={{marginBottom: 0}}
            >
                <Input placeholder={t('deviceSettings.deviceNamePlaceholder')} />
            </Form.Item>

            <Form.Item
                label={<InfoLabel label={t('deviceSettings.deviceDescriptionLabel')} tooltip={t('deviceSettings.deviceDescriptionTooltip')} />}
                name="deviceDescription"
                rules={[{max: 200, message: t('deviceSettings.validationDeviceDescriptionMax')}]}
                style={{marginBottom: 0}}
            >
                <Input.TextArea rows={3} maxLength={200} showCount placeholder={t('deviceSettings.deviceDescriptionPlaceholder')} />
            </Form.Item>

            <Row gutter={[appThemeConfig.card.spacing.sectionGap, 0]}>
                <Col xs={24} md={12}>
                    <Form.Item
                        label={<InfoLabel label={t('deviceSettings.temperatureUnitLabel')} tooltip={t('deviceSettings.temperatureUnitTooltip')} />}
                        name="unitOfTemperature"
                        rules={[{required: true, message: t('deviceSettings.validationTemperatureUnitRequired')}]}
                        style={{marginBottom: 0}}
                    >
                        <Select options={temperatureUnitOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label={<InfoLabel label={t('deviceSettings.timeZoneLabel')} tooltip={t('deviceSettings.timeZoneTooltip')} />}
                        name="timeZone"
                        rules={[{required: true, message: t('deviceSettings.validationTimeZoneRequired')}]}
                        style={{marginBottom: 0}}
                    >
                        <Select showSearch optionFilterProp="label" options={TIME_ZONE_OPTIONS} placeholder={t('deviceSettings.timeZonePlaceholder')} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[appThemeConfig.card.spacing.sectionGap, 0]}>
                <Col xs={24} md={12}>
                    <Form.Item
                        label={<InfoLabel label={t('deviceSettings.liquidUnitLabel')} tooltip={t('deviceSettings.liquidUnitTooltip')} />}
                        name="waterTankUnit"
                        rules={[{required: true, message: t('deviceSettings.validationLiquidUnitRequired')}]}
                        style={{marginBottom: 0}}
                    >
                        <Select options={liquidUnitOptions} />
                    </Form.Item>
                </Col>
            </Row>
        </SettingsSection>
    );
};

export default DeviceGeneralSection;
