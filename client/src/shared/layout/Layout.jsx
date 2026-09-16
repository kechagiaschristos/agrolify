import {useEffect, useState} from 'react';
import {Outlet} from 'react-router-dom';
import {Drawer, Grid, Layout as AntLayout, theme} from 'antd';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar.jsx';
import {useSelector} from 'react-redux';
import {selectActiveTheme} from '../../features/profile/store/userSelectors';
import {selectSelectedDevice} from '../../features/devices/store/devicesSelectors.js';
import appThemeConfig from '../theme/appThemeConfig';
import ConnectionStatus from '../components/ConnectionStatus.jsx';

function Layout() {
    const {token} = theme.useToken();
    const {lg: isDesktop} = Grid.useBreakpoint();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const activeTheme = useSelector(selectActiveTheme);
    const hasSelectedDevice = Boolean(useSelector(selectSelectedDevice));
    const contentInset = appThemeConfig.card.spacing.rowGap;

    useEffect(() => {
        document.body.setAttribute('direction', 'ltr');
    }, [activeTheme]);

    return (
        <AntLayout style={{height: '100dvh', minHeight: 0, overflow: 'hidden', background: token.colorBgLayout}}>
            {hasSelectedDevice ? (
                isDesktop ? (
                    <AntLayout.Sider
                        width={220}
                        collapsed={collapsed}
                        collapsedWidth={80}
                        trigger={null}
                        theme={activeTheme}
                        style={{
                            position: 'sticky',
                            top: 0,
                            height: '100dvh',
                            overflow: 'hidden',
                            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <Sidebar collapsed={collapsed} />
                    </AntLayout.Sider>
                ) : (
                    <Drawer
                        placement="left"
                        closable={false}
                        open={mobileSidebarOpen}
                        onClose={() => setMobileSidebarOpen(false)}
                        size="min(248px, 72vw)"
                        styles={{body: {padding: 0}}}
                    >
                        <Sidebar isMobile onNavigate={() => setMobileSidebarOpen(false)} />
                    </Drawer>
                )
            ) : null}

            <AntLayout style={{minWidth: 0, height: '100dvh', minHeight: 0, overflow: 'hidden'}}>
                <Header
                    collapsed={collapsed}
                    isDesktop={isDesktop}
                    showSidebarControls={hasSelectedDevice}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                    onToggleCollapse={() => setCollapsed((prev) => !prev)}
                />
                <ConnectionStatus />
                <AntLayout.Content
                    style={{
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: isDesktop ? `${contentInset}px` : 0,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        background: token.colorBgLayout,
                    }}
                >
                    <div
                        style={{
                            minWidth: 0,
                            minHeight: isDesktop ? 0 : '100%',
                            height: isDesktop ? '100%' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            padding: isDesktop ? undefined : `${contentInset}px ${contentInset}px 0`,
                        }}
                    >
                        <div style={{minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', flex: isDesktop ? 1 : '1 0 auto'}}>
                            <Outlet/>
                        </div>
                        {!isDesktop ? (
                            <div style={{marginInline: `-${contentInset}px`, flexShrink: 0}}>
                                <Footer topGap={contentInset} />
                            </div>
                        ) : null}
                    </div>
                </AntLayout.Content>
                {isDesktop ? <Footer /> : null}
            </AntLayout>
        </AntLayout>
    );
}

export default Layout;
