import {useEffect, useRef, useState} from 'react';
import {CloseOutlined} from '@ant-design/icons';
import {Avatar, Button, Card, Col, Empty, Row, Space, Statistic, theme, Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import {GoogleMap, InfoWindowF, MarkerClustererF, MarkerF, useJsApiLoader,} from '@react-google-maps/api';
import appThemeConfig from '../../../shared/theme/appThemeConfig';

const siteCardSpacing = appThemeConfig.card.spacing;
const getSiteCardShellStyle = appThemeConfig.card.styles.shell;
const MAP_FALLBACK_CENTER = {lat: 37.9838, lng: 23.7275};
const GOOGLE_MAPS_API_KEY = (
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    || import.meta.env?.VITE_GOOGLE_MAPS_KEY
    || import.meta.env?.GOOGLE_MAPS_API_KEY
    || ''
).trim();

const googleMapContainerStyle = {
    width: '100%',
    height: '100%',
};

const lightMapStyles = [
    {featureType: 'poi', stylers: [{visibility: 'off'}]},
    {featureType: 'transit', stylers: [{visibility: 'off'}]},
];

const darkMapStyles = [
    {elementType: 'geometry', stylers: [{color: '#1f2937'}]},
    {elementType: 'labels.text.stroke', stylers: [{color: '#111827'}]},
    {elementType: 'labels.text.fill', stylers: [{color: '#9ca3af'}]},
    {featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{color: '#d1d5db'}]},
    {featureType: 'poi', stylers: [{visibility: 'off'}]},
    {featureType: 'road', elementType: 'geometry', stylers: [{color: '#374151'}]},
    {featureType: 'road', elementType: 'geometry.stroke', stylers: [{color: '#1f2937'}]},
    {featureType: 'road', elementType: 'labels.text.fill', stylers: [{color: '#9ca3af'}]},
    {featureType: 'transit', stylers: [{visibility: 'off'}]},
    {featureType: 'water', elementType: 'geometry', stylers: [{color: '#0f172a'}]},
    {featureType: 'water', elementType: 'labels.text.fill', stylers: [{color: '#94a3b8'}]},
];

const baseMapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const hasValidPosition = (device) => (
    device.hasCoordinates
    && Number.isFinite(device.position?.lat) && Math.abs(device.position.lat) <= 90
    && Number.isFinite(device.position?.lng) && Math.abs(device.position.lng) <= 180
);

const detachClusterer = (clusterer) => {
    if (!clusterer) return;
    // Stop redraws before child markers unmount and the map loses its bounds.
    clusterer.clearMarkers();
    clusterer.setMap(null);
};
const getMapCenter = (devices = []) => {
    const positionedDevices = devices.filter((device) => device.hasCoordinates);

    if (!positionedDevices.length) {
        return MAP_FALLBACK_CENTER;
    }

    const totals = positionedDevices.reduce((accumulator, device) => ({
        lat: accumulator.lat + device.position.lat,
        lng: accumulator.lng + device.position.lng,
    }), {lat: 0, lng: 0});

    return {lat: totals.lat / positionedDevices.length, lng: totals.lng / positionedDevices.length};
};

const getFallbackMarkerStyle = (device, index, devices) => {
    const positions = devices.filter((item) => item.hasCoordinates).map((item) => item.position);
    const latitudes = positions.map(({lat}) => lat);
    const longitudes = positions.map(({lng}) => lng);
    const latMin = Math.min(...latitudes);
    const latMax = Math.max(...latitudes);
    const lngMin = Math.min(...longitudes);
    const lngMax = Math.max(...longitudes);
    const latRange = latMax - latMin || 0.4;
    const lngRange = lngMax - lngMin || 0.4;

    return {
        key: `${device.id}-${index}`,
        top: `${100 - clamp(((device.position.lat - latMin) / latRange) * 100, 8, 92)}%`,
        left: `${clamp(((device.position.lng - lngMin) / lngRange) * 100, 8, 92)}%`,
    };
};

const createMarkerIcon = ({color, selected = false}) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${selected ? 46 : 38}" height="${selected ? 54 : 46}" viewBox="0 0 46 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 53C23 53 42 33.7 42 22.5C42 12.3 33.5 4 23 4C12.5 4 4 12.3 4 22.5C4 33.7 23 53 23 53Z" fill="${color}" stroke="#FFFFFF" stroke-width="3"/>
            <circle cx="23" cy="22" r="${selected ? 8 : 6}" fill="white"/>
        </svg>
    `)}`,
    scaledSize: typeof window !== 'undefined' && window.google
        ? new window.google.maps.Size(selected ? 46 : 38, selected ? 54 : 46)
        : undefined,
});

function DeviceInfoBox({device, t, token, onClose, floating = false}) {
    const metrics = [
        {key: 'airTemperature', label: t('mapPage.metrics.airTemperature'), value: device.metrics.airTemperature ?? null, suffix: device.metrics.unit === 'fah' ? '\u00B0F' : '\u00B0C', precision: 1},
        {key: 'airHumidity', label: t('mapPage.metrics.airHumidity'), value: device.metrics.airHumidity ?? null, suffix: '%', precision: 0},
        {key: 'soilMoisture', label: t('mapPage.metrics.soilMoisture'), value: device.metrics.soilMoisture ?? null, suffix: '%', precision: 0},
        {key: 'soilTemperature', label: t('mapPage.metrics.soilTemperature'), value: device.metrics.soilTemperature ?? null, suffix: device.metrics.unit === 'fah' ? '\u00B0F' : '\u00B0C', precision: 1},
    ];

    return (
        <Card
            size="small"
            variant="borderless"
            onClick={(event) => event.stopPropagation()}
            style={{
                width: 260,
                borderRadius: 16,
                background: token.colorBgElevated,
                boxShadow: floating ? token.boxShadowSecondary : 'none',
            }}
            styles={{body: {padding: siteCardSpacing.padding}}}
        >
            <Space orientation="vertical" size={siteCardSpacing.rowGap} style={{width: '100%'}}>
                <Space align="start" style={{width: '100%', justifyContent: 'space-between'}}>
                    <Space orientation="vertical" size={2}>
                        <Typography.Text strong style={{fontSize: token.fontSizeLG, lineHeight: 1.2}}>{device.name}</Typography.Text>
                        <Typography.Text type="secondary" style={{fontSize: token.fontSizeSM, lineHeight: 1.3}}>{device.locationLabel}</Typography.Text>
                    </Space>
                    {floating ? <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} /> : null}
                </Space>
                <Typography.Text type="secondary" style={{fontSize: token.fontSizeSM, lineHeight: 1.3}}>{device.lastSeenLabel}</Typography.Text>
                <Row gutter={[siteCardSpacing.rowGap, siteCardSpacing.rowGap]}>
                    {metrics.map((metric) => (
                        <Col key={metric.key} span={12}>
                            {metric.textValue ? (
                                <div>
                                    <Typography.Text type="secondary" style={{display: 'block', fontSize: token.fontSizeSM, lineHeight: 1.3}}>{metric.label}</Typography.Text>
                                    <Typography.Text strong style={{fontSize: token.fontSizeLG, lineHeight: 1.2}}>{metric.textValue}</Typography.Text>
                                </div>
                            ) : (
                                <Statistic
                                    title={<span style={{fontSize: token.fontSizeSM, lineHeight: 1.3, color: token.colorTextSecondary}}>{metric.label}</span>}
                                    value={metric.value}
                                    suffix={metric.suffix}
                                    precision={metric.precision}
                                    styles={{content: {fontSize: token.fontSizeLG, lineHeight: 1.2, fontWeight: 600}}}
                                />
                            )}
                        </Col>
                    ))}
                </Row>
            </Space>
        </Card>
    );
}

function EmptyMapCard({description, token, image}) {
    return (
        <Card
            style={{...getSiteCardShellStyle(token), padding: 0, minHeight: 0}}
            styles={{body: {padding: 0, height: '100%'}}}
            variant="borderless"
        >
            <div style={{minHeight: 520, height: '100%', display: 'grid', placeItems: 'center'}}>
                <Empty description={description} image={image} />
            </div>
        </Card>
    );
}

function DeviceMapCanvas({
    devices,
    selectedDeviceId,
    onSelectDevice,
}) {
    const {t} = useTranslation();
    const {token} = theme.useToken();
    const isDarkTheme = token.colorBgBase === '#000';
    const [mapInstance, setMapInstance] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const clustererRef = useRef(null);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const ignoreNextMapClickRef = useRef(false);
    const {isLoaded, loadError} = useJsApiLoader({
        id: 'device-map-page',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });
    const mapDevices = devices.filter(hasValidPosition);
    const highlightedDeviceId = activeDeviceId ?? selectedDeviceId;
    const selectedDevice = mapDevices.find((device) => String(device.id) === String(highlightedDeviceId)) ?? null;
    const popupDevice = mapDevices.find((device) => String(device.id) === String(activeDeviceId)) ?? null;
    const mapOptions = {
        ...baseMapOptions,
        styles: isDarkTheme ? darkMapStyles : lightMapStyles,
    };
    const openDevicePopup = (deviceId) => {
        ignoreNextMapClickRef.current = true;
        setActiveDeviceId(deviceId);
        onSelectDevice(deviceId);
        window.setTimeout(() => {
            ignoreNextMapClickRef.current = false;
        }, 0);
    };
    const closeDevicePopup = () => setActiveDeviceId(null);
    const handleMapBackgroundClick = () => {
        if (ignoreNextMapClickRef.current) {
            return;
        }

        closeDevicePopup();
    };

    useEffect(() => {
        if (!mapInstance || !selectedDevice || !window.google) {
            return;
        }

        mapInstance.panTo(selectedDevice.position);

        if ((mapInstance.getZoom() || 0) < 9) {
            mapInstance.setZoom(9);
        }
    }, [mapInstance, selectedDevice]);

    if (!devices.length) {
        return <EmptyMapCard description={t('mapPage.emptyNoDevices')} token={token} />;
    }

    if (!mapDevices.length) {
        return <EmptyMapCard description={t('mapPage.emptyNoCoordinates')} token={token} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const fallbackMap = (
        <div
            onClick={handleMapBackgroundClick}
            style={{
                position: 'relative',
                minHeight: 560,
                height: '100%',
                borderRadius: token.borderRadiusLG,
                overflow: 'hidden',
                background: isDarkTheme
                    ? 'linear-gradient(180deg, #111827 0%, #0f172a 45%, #0b1220 100%)'
                    : 'linear-gradient(180deg, #eef7ff 0%, #f8fbff 45%, #ffffff 100%)',
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(${isDarkTheme ? 'rgba(96, 165, 250, 0.10)' : 'rgba(47, 111, 237, 0.08)'} 1px, transparent 1px),
                        linear-gradient(90deg, ${isDarkTheme ? 'rgba(96, 165, 250, 0.10)' : 'rgba(47, 111, 237, 0.08)'} 1px, transparent 1px)
                    `,
                    backgroundSize: '56px 56px',
                }}
            />

            {mapDevices.map((device, index) => {
                const markerStyle = getFallbackMarkerStyle(device, index, mapDevices);
                const isSelected = device.id === selectedDevice?.id;

                return (
                    <Button
                        key={markerStyle.key}
                        onClick={(event) => {
                            event.stopPropagation();
                            openDevicePopup(device.id);
                        }}
                        type="text"
                        style={{
                            position: 'absolute',
                            top: markerStyle.top,
                            left: markerStyle.left,
                            transform: 'translate(-50%, -50%)',
                            background: 'transparent',
                            height: 'auto',
                            padding: 0,
                            boxShadow: 'none',
                            zIndex: isSelected ? 3 : 2,
                        }}
                    >
                        <Avatar
                            size={isSelected ? 24 : 18}
                            style={{
                                background: device.status.hex,
                                border: '4px solid rgba(255,255,255,0.95)',
                                boxShadow: isSelected
                                    ? `0 0 0 8px ${device.status.hex}22`
                                    : `0 8px 18px ${device.status.hex}26`,
                            }}
                        />
                    </Button>
                );
            })}

            {popupDevice ? (
                <div style={{position: 'absolute', left: 16, bottom: 16, zIndex: 4}}>
                    <DeviceInfoBox device={popupDevice} t={t} token={token} floating onClose={closeDevicePopup} />
                </div>
            ) : null}
        </div>
    );

    return (
        <Card
            style={{
                ...getSiteCardShellStyle(token),
                overflow: 'hidden',
                minHeight: 0,
            }}
            styles={{body: {padding: siteCardSpacing.padding, height: '100%', display: 'flex', flexDirection: 'column'}}}
            variant="borderless"
        >
            <Space align="center" style={{width: '100%', justifyContent: 'space-between', padding: '0 0 16px 0', flex: '0 0 auto'}} wrap>
                <Space orientation="vertical" size={2}>
                    <Typography.Title level={4} style={{margin: 0}}>
                        {t('mapPage.title')}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        {t('mapPage.subtitle')}
                    </Typography.Text>
                </Space>
            </Space>

            <div
                style={{
                    flex: 1,
                    minHeight: 560,
                    borderRadius: token.borderRadiusLG,
                    overflow: 'hidden',
                    background: token.colorBgContainer,
                }}
            >
                {GOOGLE_MAPS_API_KEY && isLoaded && !loadError ? (
                    <GoogleMap
                        mapContainerStyle={googleMapContainerStyle}
                        center={getMapCenter(mapDevices)}
                        zoom={8}
                        options={mapOptions}
                        onClick={handleMapBackgroundClick}
                        onLoad={setMapInstance}
                        onIdle={() => setMapReady(true)}
                        onUnmount={() => {
                            detachClusterer(clustererRef.current);
                            clustererRef.current = null;
                            setMapReady(false);
                            setMapInstance(null);
                        }}
                    >
                        {mapReady && <MarkerClustererF
                            onLoad={(clusterer) => { clustererRef.current = clusterer; }}
                            onUnmount={detachClusterer}
                        >
                            {(clusterer) => (
                                <>
                                    {mapDevices.map((device) => (
                                        <MarkerF
                                            key={device.id}
                                            clusterer={clusterer}
                                            position={device.position}
                                            icon={createMarkerIcon({
                                                color: device.status.hex,
                                                selected: device.id === selectedDevice?.id,
                                            })}
                                            onClick={() => openDevicePopup(device.id)}
                                        />
                                    ))}
                                </>
                            )}
                        </MarkerClustererF>}

                        {popupDevice ? (
                            <InfoWindowF position={popupDevice.position} onCloseClick={closeDevicePopup}>
                                <DeviceInfoBox device={popupDevice} t={t} token={token} />
                            </InfoWindowF>
                        ) : null}
                    </GoogleMap>
                ) : fallbackMap}
            </div>
        </Card>
    );
}

export default DeviceMapCanvas;
