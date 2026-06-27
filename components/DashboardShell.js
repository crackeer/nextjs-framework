'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ArrowUp, Menu, X, LogOut, User } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { getCurrentEnv } from '../lib/util';
import getMenu from '../lib/menu';

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

// 页面标题上下文：子页面可通过 usePageTitle 设置内容区标题
const PageTitleContext = createContext(null);

export function usePageTitle() {
    return useContext(PageTitleContext);
}

export default function DashboardShell({ children }) {
    const pathname = usePathname();
    const [inited, setInited] = useState(false);
    const [title, setTitle] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [topSelectedKey, setTopSelectedKey] = useState('');
    const [allMenus, setAllMenus] = useState([]);
    const [showBackTop, setShowBackTop] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // 初始化：读取本地折叠状态、菜单、屏幕尺寸
    useEffect(() => {
        const collapsedStored = localStorage.getItem('collapsed') > 0;
        const env = getCurrentEnv();
        const menus = getMenu(env);
        setCollapsed(collapsedStored);
        setIsMobile(window.innerWidth < 768);
        setAllMenus(menus);
        setInited(true);
    }, []);

    // 获取当前登录用户
    const fetchCurrentUser = useCallback(async () => {
        try {
            const resp = await fetch('/api/auth/me');
            if (resp.ok) {
                const data = await resp.json();
                setCurrentUser(data.user || null);
            } else {
                setCurrentUser(null);
            }
        } catch {
            setCurrentUser(null);
        }
    }, []);

    // 路径变化时更新选中状态与当前用户
    useEffect(() => {
        if (!allMenus.length) return;
        setSelectedKeys([pathname]);
        setTopSelectedKey(getTopKeyByPath(allMenus, pathname));
        if (pathname !== '/login') {
            fetchCurrentUser();
        }
    }, [pathname, allMenus, fetchCurrentUser]);

    const onLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            /* ignore */
        }
        window.location.href = '/login';
    };

    // 滚动与窗口大小监听
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setShowBackTop(y > 200);
        };
        const onResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile((prev) => {
                if (mobile !== prev) {
                    setMobileDrawerOpen(false);
                    return mobile;
                }
                return prev;
            });
        };
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const setCollapse = (value) => {
        setCollapsed(value);
        localStorage.setItem('collapsed', value ? '1' : '0');
    };

    const onTopMenuClick = (key) => {
        const item = allMenus.find((m) => m.key === key);
        // 带子菜单的顶部项仅切换左侧子导航，不跳转
        if (item && item.submenu) {
            setTopSelectedKey(key);
        }
    };

    const topMenus = allMenus.filter((item) => !item.hide);
    const activeTop = topMenus.find((item) => item.key === topSelectedKey);
    const subMenus = activeTop && activeTop.submenu ? activeTop.submenu.filter((s) => !s.hide) : [];
    const showSider = subMenus.length > 0;

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
                        <span className={cn('truncate', !isMobile && collapsed && 'sr-only')}>{item.title}</span>
                    </a>
                );
            })}
        </nav>
    );

    if (!inited) {
        return null;
    }

    return (
        <PageTitleContext.Provider value={{ setTitle }}>
            <div className="min-h-screen flex flex-col">
                {/* 顶部主导航 */}
                <header className="flex items-center h-14 px-3 sm:px-4 bg-zinc-900 text-zinc-50 sticky top-0 z-40">
                    {/* 手机端汉堡按钮：仅当有子菜单时显示 */}
                    {showSider && isMobile && (
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
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
                                    onClick={() => onTopMenuClick(item.key)}
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
                    {/* 当前用户与登出 */}
                    {currentUser && (
                        <div className="flex items-center gap-2 ml-2 sm:ml-4 shrink-0">
                            <span className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-300">
                                <User className="h-4 w-4" />
                                {currentUser.username}
                            </span>
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                title="登出"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">登出</span>
                            </button>
                        </div>
                    )}
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
                                onClick={() => setCollapse(!collapsed)}
                                className="absolute bottom-3 left-1/2 -translate-x-1/2 p-1.5 rounded-md border bg-background hover:bg-accent"
                                title={collapsed ? '展开' : '收起'}
                            >
                                <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                            </button>
                        </aside>
                    )}

                    {/* 手机端：抽屉式覆盖侧栏 */}
                    {showSider && isMobile && mobileDrawerOpen && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <div
                                className="absolute inset-0 bg-black/50"
                                onClick={() => setMobileDrawerOpen(false)}
                            />
                            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-xl flex flex-col">
                                <div className="flex items-center justify-between h-14 px-4 border-b">
                                    <span className="font-semibold">子菜单</span>
                                    <button
                                        onClick={() => setMobileDrawerOpen(false)}
                                        className="p-1.5 rounded-md hover:bg-accent"
                                        aria-label="关闭菜单"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">{renderSubNav(() => setMobileDrawerOpen(false))}</div>
                            </aside>
                        </div>
                    )}

                    {/* 内容区 */}
                    <main className="flex-1 min-w-0 p-3 sm:p-5 pb-12">
                        <div>{title}</div>
                        <Separator className="my-4" />
                        {children}
                        <div id="json-id"></div>
                    </main>
                </div>
            </div>

            {showBackTop && (
                <Button size="icon" className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg" onClick={scrollToTop}>
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}
        </PageTitleContext.Provider>
    );
}
