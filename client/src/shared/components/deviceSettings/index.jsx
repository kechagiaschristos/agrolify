import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Empty, Form, Space, Spin} from 'antd';
import {useTranslation} from 'react-i18next';
import {deleteDevice, fetchDevices, updateDevice} from '../../../features/devices/store/devicesSlice';
import {updateUser} from '../../../features/profile/store/userSlice.js';
import {
    selectDeleteDeviceLoading,
    selectFetchDevicesLoading,
    selectSelectedDevice,
    selectUpdateDeviceLoading,
} from '../../../features/devices/store/devicesSelectors';
import {selectSelectedDeviceCode} from '../../../features/profile/store/userSelectors';
import appThemeConfig from '../../theme/appThemeConfig';
import Alert from '../Alert';
import {getApiSuccessMessage} from '../../api/apiMessages.js';
import DeviceAirTemperatureSection from './DeviceAirTemperatureSection.jsx';
import DeviceGeneralSection from './DeviceGeneralSection.jsx';
import DeviceSettingsActions from './DeviceSettingsActions.jsx';
import DeviceWaterSection from './DeviceWaterSection.jsx';

function DeviceSettings() {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const fetchDevicesLoading = useSelector(selectFetchDevicesLoading);
    const updateDeviceLoading = useSelector(selectUpdateDeviceLoading);
    const deleteDeviceLoading = useSelector(selectDeleteDeviceLoading);
    const selectedDeviceCode = useSelector(selectSelectedDeviceCode);
    const selectedDevice = useSelector(selectSelectedDevice);
    const [form] = Form.useForm();
    const formLoading = updateDeviceLoading || deleteDeviceLoading;

    useEffect(() => {
        if (selectedDeviceCode && !selectedDevice && !fetchDevicesLoading) {
            dispatch(fetchDevices());
        }
    }, [dispatch, fetchDevicesLoading, selectedDevice, selectedDeviceCode]);

    useEffect(() => {
        if (selectedDevice) {
            form.setFieldsValue({
                deviceName: selectedDevice.name,
                deviceDescription: selectedDevice.description,
                timeZone: selectedDevice.time_zone || 'UTC',
                unitOfTemperature: selectedDevice.temperature_unit || 'cel',
                minAirTemperature: selectedDevice.temperature_air_min_c,
                maxAirTemperature: selectedDevice.temperature_air_max_c,
                waterTankUnit: selectedDevice.liquid_unit || 'liters',
                waterTankCapacityLiters: selectedDevice.water_tank_capacity_liters,
            });
        } else {
            form.resetFields();
        }
    }, [form, selectedDevice]);

    const handleSave = async ({deviceName, deviceDescription, timeZone, unitOfTemperature, minAirTemperature, maxAirTemperature, waterTankUnit, waterTankCapacityLiters}) => {
        if (!selectedDevice || !selectedDeviceCode) {
            return;
        }

        const devicePatch = {};
        const nextDeviceName = deviceName?.trim();
        if (nextDeviceName && nextDeviceName !== selectedDevice.name) {
            devicePatch.name = nextDeviceName;
        }

        const normalizedDescription = deviceDescription?.trim() || '';
        const currentDescription = selectedDevice.description?.trim() || '';
        if (normalizedDescription !== currentDescription) {
            devicePatch.description = normalizedDescription || null;
        }

        if (unitOfTemperature !== (selectedDevice.temperature_unit || 'cel')) {
            devicePatch.temperature_unit = unitOfTemperature;
        }

        if (timeZone !== (selectedDevice.time_zone || 'UTC')) {
            devicePatch.time_zone = timeZone;
        }

        if (
            Number(minAirTemperature) !== Number(selectedDevice.temperature_air_min_c) ||
            Number(maxAirTemperature) !== Number(selectedDevice.temperature_air_max_c)
        ) {
            devicePatch.temperature_air_min_c = Number(minAirTemperature);
            devicePatch.temperature_air_max_c = Number(maxAirTemperature);
        }

        if (Number(waterTankCapacityLiters) !== Number(selectedDevice.water_tank_capacity_liters)) {
            devicePatch.water_tank_capacity_liters = Number(waterTankCapacityLiters);
        }

        if (waterTankUnit !== (selectedDevice.liquid_unit || 'liters')) {
            devicePatch.liquid_unit = waterTankUnit;
        }

        if (Object.keys(devicePatch).length === 0) {
            return;
        }

        try {
            const response = await dispatch(updateDevice({deviceCode: selectedDeviceCode, data: devicePatch})).unwrap();
            Alert.show({type: 'success', message: getApiSuccessMessage(response) || t('deviceSettings.saveSuccess')});
        } catch {
            // API errors are displayed by the global axios interceptor.
        }
    };

    const handleDelete = async () => {
        if (!selectedDevice || !selectedDeviceCode) {
            return;
        }

        const payload = await dispatch(deleteDevice({deviceCode: selectedDeviceCode})).unwrap();
        await dispatch(updateUser({data: {selected_device_code: null}})).unwrap().catch(() => null);
        await dispatch(fetchDevices());
        Alert.show({type: 'success', message: getApiSuccessMessage(payload) || t('deviceSettings.deleteSuccess')});
    };

    if (fetchDevicesLoading && !selectedDevice) {
        return (
            <div style={{textAlign: 'center', padding: '32px 0'}}>
                <Spin size="large" />
            </div>
        );
    }

    if (!selectedDevice) {
        return (
            <div style={{width: '100%'}}>
                <Empty description={t('deviceSettings.noSelectedDevice')} />
            </div>
        );
    }

    return (
        <div style={{width: '100%'}}>
            <Form form={form} layout="vertical" onFinish={handleSave} disabled={formLoading}>
                <Space orientation="vertical" size={appThemeConfig.card.spacing.rowGap} style={{width: '100%'}}>
                    <DeviceGeneralSection deviceCode={selectedDeviceCode} t={t} />
                    <DeviceWaterSection t={t} />
                    <DeviceAirTemperatureSection t={t} />
                </Space>

                <DeviceSettingsActions
                    deleteDeviceLoading={deleteDeviceLoading}
                    formLoading={formLoading}
                    onDelete={handleDelete}
                    t={t}
                />
            </Form>
        </div>
    );
}

export default DeviceSettings;
