'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ArrowUp, LogOut, User } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import SshNavDropdown from './SshNavDropdown';
import FtpNavDropdown from './FtpNavDropdown';
import OssNavDropdown from './OssNavDropdown';
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
    const [topSelectedKey, setTopSelectedKey] = useState('');
    const [allMenus, setAllMenus] = useState([]);
    const [showBackTop, setShowBackTop] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    // 当前打开的顶部下拉 key（同一时间只开一个）
    const [openDropdown, setOpenDropdown] = useState(null);
    const navRef = useRef(null);

    // 初始化：加载菜单
    useEffect(() => {
        const env = getCurrentEnv();
        const menus = getMenu(env);
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

    // 滚动监听：控制返回顶部按钮显隐
    useEffect(() => {
        const onScroll = () => {
            setShowBackTop(window.scrollY > 200);
        };
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, []);

    // 点击导航外部关闭下拉
    useEffect(() => {
        const onClick = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!inited) {
        return null;
    }

    const topMenus = allMenus.filter((item) => !item.hide);

    return (
        <PageTitleContext.Provider value={{ setTitle }}>
            <div className="min-h-screen flex flex-col">
                {/* 顶部主导航 */}
                <header className="flex items-center h-14 px-3 sm:px-4 bg-zinc-900 text-zinc-50 sticky top-0 z-40">
                    <div className="text-lg font-semibold mr-4 sm:mr-8 whitespace-nowrap">Admin后台</div>
                    <nav ref={navRef} className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
                        {topMenus.map((item) => {
                            const active = item.key === topSelectedKey;
                            // 无子菜单：直接跳转
                            if (!item.submenu) {
                                return (
                                    <a
                                        key={item.key}
                                        href={item.href}
                                        className={cn(
                                            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                                            active
                                                ? 'bg-zinc-700 text-white'
                                                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                        )}
                                    >
                                        {item.title}
                                    </a>
                                );
                            }
                            // 带子菜单：点击展开下拉
                            const open = openDropdown === item.key;
                            const subItems = item.submenu.filter((s) => !s.hide);
                            return (
                                <div key={item.key} className="relative shrink-0">
                                    <button
                                        onClick={() => setOpenDropdown(open ? null : item.key)}
                                        className={cn(
                                            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                                            active || open
                                                ? 'bg-zinc-700 text-white'
                                                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                        )}
                                    >
                                        {item.title}
                                        <ChevronDown
                                            className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
                                        />
                                    </button>
                                    {open && (
                                        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-zinc-800 border border-zinc-700 rounded-md shadow-xl py-1">
                                            {subItems.map((sub) => {
                                                const subActive = sub.key === pathname;
                                                return (
                                                    <a
                                                        key={sub.key}
                                                        href={sub.href}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className={cn(
                                                            'block px-3 py-2 text-sm transition-colors',
                                                            subActive
                                                                ? 'bg-zinc-700 text-white'
                                                                : 'text-zinc-200 hover:bg-zinc-700'
                                                        )}
                                                    >
                                                        {sub.title}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                    {/* SSH 终端下拉 */}
                    <SshNavDropdown />
                    {/* FTP 文件管理下拉 */}
                    <FtpNavDropdown />
                    {/* OSS 文件管理下拉 */}
                    <OssNavDropdown />
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

                {/* 内容区：占满宽度 */}
                <main className="flex-1 min-w-0 p-3 sm:p-5 pb-12">
                    <div>{title}</div>
                    <Separator className="my-4" />
                    {children}
                    <div id="json-id"></div>
                </main>
            </div>

            {showBackTop && (
                <Button size="icon" className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg" onClick={scrollToTop}>
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}
        </PageTitleContext.Provider>
    );
}
