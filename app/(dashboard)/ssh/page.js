'use client';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Plus, Terminal as TerminalIcon } from 'lucide-react';
import { usePageTitle } from '../../../components/DashboardShell';

// 全局自增 tab 计数器，保证 tab id 唯一
let tabIdSeq = 0;

export default function SshPage() {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
            <SshPageInner />
        </Suspense>
    );
}

function SshPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [tabs, setTabs] = useState([]); // [{ id, host, title }]
    const [activeId, setActiveId] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [showHostPicker, setShowHostPicker] = useState(false);
    // 记录已处理过的导航标记，避免重复开 tab
    const lastNavKeyRef = useRef(null);

    // 拉取 SSH 主机列表（用于页内 "+" 按钮选择）
    useEffect(() => {
        fetch('/api/ssh/hosts')
            .then((r) => r.json())
            .then((data) => setHosts(data.hosts || []))
            .catch(() => {});
    }, []);

    // 从 URL 参数新建 tab（顶部导航下拉点击后跳转过来）
    useEffect(() => {
        const host = searchParams.get('host');
        const navKey = searchParams.get('t') || host;
        if (host && navKey !== lastNavKeyRef.current) {
            lastNavKeyRef.current = navKey;
            tabIdSeq += 1;
            const tab = { id: tabIdSeq, host, title: host };
            setTabs((prev) => [...prev, tab]);
            setActiveId(tab.id);
        }
    }, [searchParams]);

    const addTab = (host) => {
        tabIdSeq += 1;
        const tab = { id: tabIdSeq, host, title: host };
        setTabs((prev) => [...prev, tab]);
        setActiveId(tab.id);
        setShowHostPicker(false);
    };

    const closeTab = useCallback(
        (id) => {
            setTabs((prev) => {
                const idx = prev.findIndex((t) => t.id === id);
                const next = prev.filter((t) => t.id !== id);
                if (activeId === id) {
                    const fallback = next[idx] || next[idx - 1] || next[0] || null;
                    setActiveId(fallback ? fallback.id : null);
                }
                return next;
            });
        },
        [activeId]
    );
    const { setTitle } = usePageTitle();

    // 面包屑标题（同步到顶栏）+ 浏览器标签
    const activeTab = tabs.find((t) => t.id === activeId);
    useEffect(() => {
        const breadcrumb = (
            <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">SSH 终端</span>
                {activeTab && (
                    <>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">{activeTab.title}</span>
                    </>
                )}
            </div>
        );
        setTitle(breadcrumb);
        return () => {
            setTitle(null);
        };
    }, [activeTab, setTitle]);

    // 浏览器标签标题
    useEffect(() => {
        document.title = activeTab ? `SSH - ${activeTab.title}` : 'SSH 终端';
    }, [activeTab]);

    return (
        <>
            <div className="flex flex-col h-[calc(100vh-115px)] border rounded-md overflow-hidden bg-black">
                {/* 标签栏 */}
                <div className="flex items-center bg-zinc-900 border-b border-zinc-700 overflow-x-auto shrink-0">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveId(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-zinc-700 whitespace-nowrap select-none ${
                                activeId === tab.id
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                        >
                            <TerminalIcon className="h-3.5 w-3.5" />
                            <span>{tab.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                                className="hover:bg-zinc-700 rounded p-0.5"
                                aria-label="关闭标签"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {/* 新建 tab */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowHostPicker((v) => !v)}
                            className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            title="新建连接"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        {showHostPicker && (
                            <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] bg-zinc-800 border border-zinc-700 rounded-md shadow-xl py-1">
                                {hosts.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-zinc-500">
                                        未配置 SSH 主机
                                    </div>
                                ) : (
                                    hosts.map((h) => (
                                        <button
                                            key={h.name}
                                            onClick={() => addTab(h.name)}
                                            className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex flex-col"
                                        >
                                            <span>{h.name}</span>
                                            <span className="text-xs text-zinc-500">
                                                {h.username}@{h.host}:{h.port}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 终端区 */}
                <div className="flex-1 relative">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`absolute inset-0 ${activeId === tab.id ? '' : 'hidden'}`}
                        >
                            <SshTerminal host={tab.host} active={activeId === tab.id} />
                        </div>
                    ))}
                    {tabs.length === 0 && (
                        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                            点击顶部导航的 Ssh，或上方 + 选择服务器连接
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// 单个终端实例：管理 xterm + WebSocket 生命周期
function SshTerminal({ host, active }) {
    const containerRef = useRef(null);
    const termRef = useRef(null);
    const wsRef = useRef(null);
    const fitRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const term = new Terminal({
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            cursorBlink: true,
            scrollback: 5000,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(container);

        // xterm 6.x 在 open() 后设置 theme 才能完整生效
        const nordTheme = {
            background: '#2e3440',
            foreground: '#d8dee9',
            cursor: '#d8dee9',
            cursorAccent: '#2e3440',
            selectionBackground: '#434c5e',
            black:   '#3b4252',
            red:     '#bf616a',
            green:   '#a3be8c',
            yellow:  '#ebcb8b',
            blue:    '#81a1c1',
            magenta: '#b48ead',
            cyan:    '#88c0d0',
            white:   '#e5e9f0',
            brightBlack:   '#4c566a',
            brightRed:     '#bf616a',
            brightGreen:   '#a3be8c',
            brightYellow:  '#ebcb8b',
            brightBlue:    '#81a1c1',
            brightMagenta: '#b48ead',
            brightCyan:    '#8fbcbb',
            brightWhite:   '#eceff4',
        };
        term.options.theme = nordTheme;
        termRef.current = term;
        fitRef.current = fitAddon;

        // 等待容器有尺寸后再 fit
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
            } catch {
                /* ignore */
            }
        });

        const cols = term.cols || 80;
        const rows = term.rows || 24;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/api/ssh/ws?host=${encodeURIComponent(host)}&cols=${cols}&rows=${rows}`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
            term.write(`\x1b[32m正在连接 ${host}…\x1b[0m\r\n`);
        };
        ws.onmessage = (e) => {
            if (e.data instanceof ArrayBuffer) {
                // 二进制 = 终端输出
                term.write(new Uint8Array(e.data));
            } else {
                // 文本 = JSON 事件
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === 'connected') {
                        term.write(`\x1b[32m已连接\x1b[0m\r\n`);
                    } else if (msg.type === 'error') {
                        term.write(`\x1b[31m${msg.message}\x1b[0m\r\n`);
                    } else if (msg.type === 'closed') {
                        term.write(`\r\n\x1b[33m${msg.message || '连接已关闭'}\x1b[0m\r\n`);
                    }
                } catch {
                    /* ignore */
                }
            }
        };
        ws.onerror = () => {
            term.write(`\x1b[31mWebSocket 错误\x1b[0m\r\n`);
        };
        ws.onclose = () => {
            term.write(`\r\n\x1b[33m连接已断开\x1b[0m\r\n`);
        };

        // 终端输入 -> 服务端（二进制）
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(new TextEncoder().encode(data));
            }
        });

        // 窗口尺寸变化时重新 fit 并通知服务端
        const onResize = () => {
            try {
                fitAddon.fit();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows })
                    );
                }
            } catch {
                /* ignore */
            }
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            try { ws.close(); } catch { /* ignore */ }
            try { term.dispose(); } catch { /* ignore */ }
        };
    }, [host]);

    // 切换到该 tab 时重新 fit（尺寸可能因 hidden 期间变化）
    useEffect(() => {
        if (active && fitRef.current) {
            requestAnimationFrame(() => {
                try {
                    fitRef.current.fit();
                } catch {
                    /* ignore */
                }
            });
        }
    }, [active]);

    return <div ref={containerRef} className="h-full w-full" />;
}
