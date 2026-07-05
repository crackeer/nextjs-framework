'use client';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Plus, Terminal as TerminalIcon, ChevronRight, ChevronDown, Trash2, Edit3, FileText, FolderPlus } from 'lucide-react';
import { usePageTitle } from '../../../components/DashboardShell';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

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
    const [tabs, setTabs] = useState([]); // [{ id, host, title }]
    const [activeId, setActiveId] = useState(null);
    // 记录已处理过的导航标记，避免重复开 tab
    const lastNavKeyRef = useRef(null);

    // 快捷命令相关状态
    const [commands, setCommands] = useState([]);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [showCommandDialog, setShowCommandDialog] = useState(false);
    const [editingCommand, setEditingCommand] = useState(null);
    const [commandForm, setCommandForm] = useState({ name: '', command: '', parent_id: null });

    // 加载快捷命令
    useEffect(() => {
        fetch('/api/ssh/commands')
            .then((r) => r.json())
            .then((data) => setCommands(data.commands || []))
            .catch(() => {});
    }, []);

    // 刷新命令列表
    const refreshCommands = () => {
        fetch('/api/ssh/commands')
            .then((r) => r.json())
            .then((data) => setCommands(data.commands || []))
            .catch(() => {});
    };

    // 切换展开/收起
    const toggleExpand = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // 执行命令到当前终端
    const executeCommand = (cmd) => {
        // 支持多行命令，每行单独执行
        const lines = cmd.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            // 延迟执行以确保顺序正确
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('ssh-execute-command', { detail: line }));
            }, index * 100);
        });
    };

    // 打开新增/编辑对话框
    const openCommandDialog = (cmd = null, parentId = null) => {
        if (cmd) {
            setEditingCommand(cmd);
            setCommandForm({ name: cmd.name, command: cmd.command, parent_id: cmd.parent_id });
        } else {
            setEditingCommand(null);
            setCommandForm({ name: '', command: '', parent_id: parentId });
        }
        setShowCommandDialog(true);
    };

    // 保存命令
    const saveCommand = async () => {
        const url = editingCommand
            ? `/api/ssh/commands/${editingCommand.id}`
            : '/api/ssh/commands';
        const method = editingCommand ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commandForm),
        });
        
        if (res.ok) {
            setShowCommandDialog(false);
            refreshCommands();
        }
    };

    // 删除命令
    const deleteCommand = async (id) => {
        if (!confirm('确定要删除这个命令吗？')) return;
        await fetch(`/api/ssh/commands/${id}`, { method: 'DELETE' });
        refreshCommands();
    };

    // 渲染命令树
    const renderCommandTree = (items, level = 0) => {
        return items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedIds.has(item.id);
            
            return (
                <div key={item.id}>
                    <div
                        className="flex items-center gap-1 px-2 py-1.5 hover:bg-zinc-800 cursor-pointer group"
                        style={{ paddingLeft: `${level * 16 + 8}px` }}
                        onDoubleClick={() => executeCommand(item.command)}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(item.id)}
                                className="p-0.5 hover:bg-zinc-700 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-zinc-400" />
                                )}
                            </button>
                        ) : (
                            <FileText className="h-3 w-3 text-zinc-500 ml-4" />
                        )}
                        <span
                            className="flex-1 text-xs text-zinc-300 truncate"
                            title={item.name}
                        >
                            {item.name}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCommandDialog(null, item.id);
                                }}
                                className="p-1 hover:bg-zinc-700 rounded"
                                title="添加子命令"
                            >
                                <FolderPlus className="h-3 w-3 text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCommandDialog(item);
                                }}
                                className="p-1 hover:bg-zinc-700 rounded"
                                title="编辑"
                            >
                                <Edit3 className="h-3 w-3 text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCommand(item.id);
                                }}
                                className="p-1 hover:bg-zinc-700 rounded"
                                title="删除"
                            >
                                <Trash2 className="h-3 w-3 text-zinc-400" />
                            </button>
                        </div>
                    </div>
                    {hasChildren && isExpanded && renderCommandTree(item.children, level + 1)}
                </div>
            );
        });
    };

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
    const { setTitle, setHideTitle } = usePageTitle();

    // 面包屑标题（同步到顶栏）+ 浏览器标签
    const activeTab = tabs.find((t) => t.id === activeId);
    useEffect(() => {
        // SSH 终端页面不需要显示标题栏
        setHideTitle(true);
        return () => {
            setHideTitle(false);
        };
    }, [setHideTitle]);

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
            <div className="flex h-[calc(100vh-80px)] border rounded-md overflow-hidden bg-black">
                {/* 左侧快捷命令栏 */}
                <div className="w-48 border-r border-zinc-700 bg-zinc-900 flex flex-col shrink-0">
                    <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-700">
                        <span className="text-xs font-medium text-zinc-400">快捷命令</span>
                        <button
                            onClick={() => openCommandDialog(null, null)}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="新增命令"
                        >
                            <Plus className="h-3 w-3 text-zinc-400" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto py-1">
                        {commands.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-zinc-500">
                                右键或点击上方+添加命令
                            </div>
                        ) : (
                            renderCommandTree(commands)
                        )}
                    </div>
                </div>

                {/* 右侧终端区域 */}
                <div className="flex flex-col flex-1 min-w-0">
                    {/* 标签栏 + 新建按钮 */}
                    <div className="flex items-center bg-zinc-900 border-b border-zinc-700 overflow-x-visible shrink-0">
                        <div className="flex items-center overflow-x-auto">
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
                        </div>
                        {/* 新建 tab - 基于第一个tab复制 */}
                        <div className="shrink-0">
                            <button
                                onClick={() => {
                                    if (tabs.length > 0) {
                                        const firstTab = tabs[0];
                                        addTab(firstTab.host);
                                    }
                                }}
                                disabled={tabs.length === 0}
                                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={tabs.length > 0 ? "新建连接（复制当前连接）" : "无连接可复制"}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
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
            </div>

            {/* 命令编辑对话框 */}
            <Dialog open={showCommandDialog} onOpenChange={setShowCommandDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCommand ? '编辑命令' : '新增命令'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">名称</label>
                            <Input
                                value={commandForm.name}
                                onChange={(e) => setCommandForm({ ...commandForm, name: e.target.value })}
                                placeholder="命令名称"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">命令内容</label>
                            <textarea
                                value={commandForm.command}
                                onChange={(e) => setCommandForm({ ...commandForm, command: e.target.value })}
                                placeholder="执行的命令（支持多行，每行一条命令）"
                                className="mt-1 w-full min-h-[120px] px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCommandDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={saveCommand}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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

        // 监听执行命令事件
        const onExecuteCommand = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
                const cmd = e.detail + '\n';
                ws.send(new TextEncoder().encode(cmd));
                term.write(`\x1b[33m$ ${e.detail}\x1b[0m\r\n`);
            }
        };
        window.addEventListener('ssh-execute-command', onExecuteCommand);

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
            window.removeEventListener('ssh-execute-command', onExecuteCommand);
            resizeObserver.disconnect();
            try { ws.close(); } catch { /* ignore */ }
            try { term.dispose(); } catch { /* ignore */ }
        };
    }, [host]);

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
        try {
            fitAddon.fit();
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
        } catch { /* ignore */ }
    });

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

    return <div ref={(el) => { containerRef.current = el; if (el) resizeObserver.observe(el); }} className="h-full w-full" />;
}
