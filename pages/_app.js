import '../styles/globals.css';
import React from 'react';
import Head from 'next/head';
import { ChevronLeft, ArrowUp, Menu, X } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Toaster } from '../components/ui/sonner';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { getCurrentEnv } from '../lib/util';
import getMenu from './menu';

// 根据当前路径反查所属的顶部一级菜单 key
function getTopKeyByPath(menus, path) {
    for (let item of menus) {
        if (item.hide) continue;
        if (item.submenu) {
            if (item.submenu.some((sub) => !sub.hide && sub.key === path)) return item.key;
        } else if (item.key === path) {
            return item.key;
        }
    }
    return '';
}

class ClassApp extends React.Component {
    component = null;
    headerRef = null;
    constructor(props) {
        super(props);
        this.state = {
            inited: false,
            title: <></>,
            headTitle: '',
            collapsed: false,
            selectedKeys: [],
            topSelectedKey: '',
            allMenus: [],
            showBackTop: false,
            mobileDrawerOpen: false,
            isMobile: false,
        };
    }
    componentDidMount = async () => {
        let collapsed = localStorage.getItem('collapsed') > 0;
        let env = getCurrentEnv();
        let menus = getMenu(env);
        let path = window.location.pathname;
        await this.setState({
            inited: true,
            selectedKeys: [path],
            topSelectedKey: getTopKeyByPath(menus, path),
            allMenus: menus,
            collapsed: collapsed,
            isMobile: window.innerWidth < 768,
        });
        window.addEventListener('scroll', this.onScroll, true);
        window.addEventListener('resize', this.onResize);
    };
    componentWillUnmount() {
        window.removeEventListener('scroll', this.onScroll, true);
        window.removeEventListener('resize', this.onResize);
    }
    onResize = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile !== this.state.isMobile) {
            this.setState({ isMobile, mobileDrawerOpen: false });
        }
    };
    onScroll = () => {
        let y = window.scrollY;
        let show = y > 200;
        if (show !== this.state.showBackTop) this.setState({ showBackTop: show });
    };
    scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    updateTitle = async () => {
        if (this.component != null && this.component.renderPageTitle != null && this.component.renderPageTitle != undefined) {
            await this.setState({ title: this.component.renderPageTitle() });
        }
    };
    refUpdate = async (ref) => {
        this.component = ref;
        if (ref != null) {
            if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
                this.setState({ headTitle: ref.htmlTitle() });
            }
            if (ref.renderPageTitle != null && ref.renderPageTitle != undefined) {
                await this.setState({ title: ref.renderPageTitle() });
            } else if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
                await this.setState({
                    title: (
                        <h3 className="text-lg font-semibold">
                            <strong>{ref.htmlTitle()}</strong>
                        </h3>
                    ),
                });
            }
        }
    };
    setCollapse = (value) => {
        this.setState({ collapsed: value });
        localStorage.setItem('collapsed', value ? '1' : '0');
    };
    onTopMenuClick = (key) => {
        const item = this.state.allMenus.find((m) => m.key === key);
        // 带子菜单的顶部项仅切换左侧子导航，不跳转
        if (item && item.submenu) {
            this.setState({ topSelectedKey: key });
        }
    };
    setMobileDrawer = (open) => {
        this.setState({ mobileDrawerOpen: open });
    };
    render() {
        const { Component, pageProps } = this.props;
        if (!this.state.inited) {
            return null;
        }
        const { allMenus, topSelectedKey, selectedKeys, collapsed, showBackTop, isMobile, mobileDrawerOpen } = this.state;
        const topMenus = allMenus.filter((item) => !item.hide);
        const activeTop = topMenus.find((item) => item.key === topSelectedKey);
        const subMenus = activeTop && activeTop.submenu ? activeTop.submenu.filter((s) => !s.hide) : [];
        const showSider = subMenus.length > 0;

        // 子导航内容（PC 与移动端共用）
        const renderSubNav = (onItemClick) => (
            <nav className="py-3">
                {subMenus.map((item) => {
                    const active = selectedKeys.includes(item.key);
                    return (
                        <a
                            key={item.key}
                            href={item.href}
                            onClick={onItemClick}
                            title={item.title}
                            className={cn(
                                'flex items-center h-10 mx-2 px-3 rounded-md text-sm transition-colors',
                                isMobile ? 'justify-start' : collapsed ? 'justify-center px-0' : 'justify-start',
                                active
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <span className={cn('truncate', !isMobile && collapsed && 'sr-only')}>
                                {item.title}
                            </span>
                        </a>
                    );
                })}
            </nav>
        );

        return (
            <>
                <Head>
                    <title>{this.state.headTitle || 'admin后台'}</title>
                    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no" />
                </Head>
                <div className="min-h-screen flex flex-col">
                    {/* 顶部主导航 */}
                    <header className="flex items-center h-14 px-3 sm:px-4 bg-zinc-900 text-zinc-50 sticky top-0 z-40">
                        {/* 手机端汉堡按钮：仅当有子菜单时显示 */}
                        {showSider && isMobile && (
                            <button
                                onClick={() => this.setMobileDrawer(true)}
                                className="mr-2 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-100 md:hidden"
                                aria-label="打开菜单"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        )}
                        <div className="text-lg font-semibold mr-4 sm:mr-8 whitespace-nowrap">Admin后台</div>
                        <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
                            {topMenus.map((item) => {
                                const active = item.key === topSelectedKey;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => this.onTopMenuClick(item.key)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                                            active
                                                ? 'bg-zinc-700 text-white'
                                                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                        )}
                                    >
                                        {item.submenu ? (
                                            item.title
                                        ) : (
                                            <a href={item.href} className="block">
                                                {item.title}
                                            </a>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </header>

                    <div className="flex flex-1">
                        {/* PC 端：固定左侧子导航 */}
                        {showSider && !isMobile && (
                            <aside
                                className={cn(
                                    'relative shrink-0 border-r bg-card transition-[width] duration-200',
                                    collapsed ? 'w-14' : 'w-52'
                                )}
                            >
                                {renderSubNav()}
                                <button
                                    onClick={() => this.setCollapse(!collapsed)}
                                    className="absolute bottom-3 left-1/2 -translate-x-1/2 p-1.5 rounded-md border bg-background hover:bg-accent"
                                    title={collapsed ? '展开' : '收起'}
                                >
                                    <ChevronLeft
                                        className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
                                    />
                                </button>
                            </aside>
                        )}

                        {/* 手机端：抽屉式覆盖侧栏 */}
                        {showSider && isMobile && mobileDrawerOpen && (
                            <div className="fixed inset-0 z-50 md:hidden">
                                <div
                                    className="absolute inset-0 bg-black/50"
                                    onClick={() => this.setMobileDrawer(false)}
                                />
                                <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-xl flex flex-col">
                                    <div className="flex items-center justify-between h-14 px-4 border-b">
                                        <span className="font-semibold">子菜单</span>
                                        <button
                                            onClick={() => this.setMobileDrawer(false)}
                                            className="p-1.5 rounded-md hover:bg-accent"
                                            aria-label="关闭菜单"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {renderSubNav(() => this.setMobileDrawer(false))}
                                    </div>
                                </aside>
                            </div>
                        )}

                        {/* 内容区 */}
                        <main className="flex-1 min-w-0 p-3 sm:p-5 pb-12">
                            <div ref={(r) => (this.headerRef = r)}>{this.state.title}</div>
                            <Separator className="my-4" />
                            <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                            <div id="json-id"></div>
                        </main>
                    </div>
                </div>

                {showBackTop && (
                    <Button
                        size="icon"
                        className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg"
                        onClick={this.scrollToTop}
                    >
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                )}
                <Toaster position="top-center" />
            </>
        );
    }
}

export default ClassApp;
