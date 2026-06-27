'use client';
import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Folder,
    File as FileIcon,
    ArrowLeft,
    Upload,
    RefreshCw,
    Trash2,
    Download,
    Pencil,
    FolderPlus,
    Home,
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';

export default function FtpPage() {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
            <FtpPageInner />
        </Suspense>
    );
}

function FtpPageInner() {
    const searchParams = useSearchParams();
    const host = searchParams.get('host');
    const [path, setPath] = useState('/');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null); // 当前选中的文件项
    const fileInputRef = useRef(null);

    // 切换 host 时回到根目录
    useEffect(() => {
        if (host) {
            setPath('/');
        }
    }, [host]);

    const fetchList = useCallback(async () => {
        if (!host) return;
        setLoading(true);
        setSelected(null);
        try {
            const resp = await fetch(`/api/ftp/${encodeURIComponent(host)}/list?path=${encodeURIComponent(path)}`);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '读取目录失败');
                setItems([]);
                return;
            }
            // 目录排在前面
            const sorted = [...(data.items || [])].sort((a, b) => {
                if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            setItems(sorted);
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setLoading(false);
        }
    }, [host, path]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // 进入目录
    const enterDir = (dir) => {
        const next = path.endsWith('/') ? path + dir.name : path + '/' + dir.name;
        setPath(next);
    };

    // 返回上级
    const goUp = () => {
        if (path === '/') return;
        const parts = path.split('/').filter(Boolean);
        parts.pop();
        setPath('/' + parts.join('/'));
    };

    // 拼接完整路径
    const joinPath = (name) => (path.endsWith('/') ? path + name : path + '/' + name);

    // 下载
    const onDownload = (item) => {
        const url = `/api/ftp/${encodeURIComponent(host)}/download?path=${encodeURIComponent(joinPath(item.name))}`;
        // 用 a 标签触发下载，浏览器会带上 cookie
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // 上传
    const onUploadClick = () => fileInputRef.current?.click();
    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('path', path);
            const resp = await fetch(`/api/ftp/${encodeURIComponent(host)}/upload`, {
                method: 'POST',
                body: fd,
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '上传失败');
                return;
            }
            toast.success('上传成功');
            fetchList();
        } catch (err) {
            toast.error('上传错误：' + err.message);
        } finally {
            e.target.value = '';
        }
    };

    // 删除
    const onDelete = async (item) => {
        if (!confirm(`确认删除 ${item.isDirectory ? '目录' : '文件'} "${item.name}"？${item.isDirectory ? '目录下所有内容将被删除。' : ''}`)) {
            return;
        }
        try {
            const resp = await fetch(`/api/ftp/${encodeURIComponent(host)}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: joinPath(item.name), isDir: item.isDirectory }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '删除失败');
                return;
            }
            toast.success('已删除');
            fetchList();
        } catch (err) {
            toast.error('删除错误：' + err.message);
        }
    };

    // 重命名
    const onRename = async (item) => {
        const newName = prompt(`重命名 "${item.name}" 为：`, item.name);
        if (!newName || newName === item.name) return;
        try {
            const resp = await fetch(`/api/ftp/${encodeURIComponent(host)}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: joinPath(item.name), to: joinPath(newName) }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '重命名失败');
                return;
            }
            toast.success('已重命名');
            fetchList();
        } catch (err) {
            toast.error('重命名错误：' + err.message);
        }
    };

    // 新建目录
    const onMkdir = async () => {
        const name = prompt('输入新目录名：');
        if (!name) return;
        try {
            const resp = await fetch(`/api/ftp/${encodeURIComponent(host)}/mkdir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: joinPath(name) }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '创建目录失败');
                return;
            }
            toast.success('目录已创建');
            fetchList();
        } catch (err) {
            toast.error('创建目录错误：' + err.message);
        }
    };

    // 面包屑分段
    const breadcrumbs = path.split('/').filter(Boolean);

    if (!host) {
        return (
            <PageHeader title="FTP 文件管理">
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    请从顶部导航 Ftp 下拉选择一个 FTP 连接
                </div>
            </PageHeader>
        );
    }

    return (
        <PageHeader title={`FTP - ${host}`}>
            <div className="space-y-3">
                {/* 工具栏 */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setPath('/')}
                        className="p-1.5 rounded-md border hover:bg-accent"
                        title="根目录"
                    >
                        <Home className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goUp}
                        disabled={path === '/'}
                        className="p-1.5 rounded-md border hover:bg-accent disabled:opacity-40"
                        title="上级目录"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    {/* 面包屑 */}
                    <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto">
                        <span className="text-muted-foreground">/</span>
                        {breadcrumbs.map((seg, idx) => {
                            const target = '/' + breadcrumbs.slice(0, idx + 1).join('/');
                            return (
                                <span key={idx} className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => setPath(target)}
                                        className="hover:underline hover:text-primary"
                                    >
                                        {seg}
                                    </button>
                                    <span className="text-muted-foreground">/</span>
                                </span>
                            );
                        })}
                    </div>
                    <button
                        onClick={fetchList}
                        className="p-1.5 rounded-md border hover:bg-accent"
                        title="刷新"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onMkdir}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md border text-sm hover:bg-accent"
                        title="新建目录"
                    >
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">新建目录</span>
                    </button>
                    <button
                        onClick={onUploadClick}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">上传</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={onFileChange}
                    />
                </div>

                {/* 文件列表 */}
                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-3 py-2 font-medium">名称</th>
                                <th className="text-right px-3 py-2 font-medium w-28">大小</th>
                                <th className="text-left px-3 py-2 font-medium w-44 hidden sm:table-cell">修改时间</th>
                                <th className="text-right px-3 py-2 font-medium w-32">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                                        加载中…
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                                        空目录
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => setSelected(item)}
                                        className={`border-t cursor-pointer ${
                                            selected?.name === item.name ? 'bg-accent' : 'hover:bg-accent/50'
                                        }`}
                                        onDoubleClick={() => item.isDirectory && enterDir(item)}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                {item.isDirectory ? (
                                                    <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                                ) : (
                                                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                                <span
                                                    className="truncate"
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        if (item.isDirectory) enterDir(item);
                                                    }}
                                                >
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">
                                            {item.isDirectory ? '-' : formatSize(item.size)}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                                            {item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-end gap-1">
                                                {!item.isDirectory && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDownload(item);
                                                        }}
                                                        className="p-1 rounded hover:bg-accent-foreground/10"
                                                        title="下载"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRename(item);
                                                    }}
                                                    className="p-1 rounded hover:bg-accent-foreground/10"
                                                    title="重命名"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(item);
                                                    }}
                                                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                                    title="删除"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="text-xs text-muted-foreground">
                    提示：双击目录进入，单击行选中
                </div>
            </div>
        </PageHeader>
    );
}

function formatSize(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(1)} ${units[i]}`;
}
