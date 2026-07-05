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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { usePageTitle } from '../../../../components/DashboardShell';

export default function SshFilePage() {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
            <SshFilePageInner />
        </Suspense>
    );
}

function SshFilePageInner() {
    const searchParams = useSearchParams();
    const host = searchParams.get('host');
    const [path, setPath] = useState('~');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // 待删除的文件/目录
    const [deleting, setDeleting] = useState(false);
    const [mkdirOpen, setMkdirOpen] = useState(false); // 新建目录弹框
    const [mkdirName, setMkdirName] = useState('');
    const [mkdirLoading, setMkdirLoading] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false); // 重命名弹框
    const [renameTarget, setRenameTarget] = useState(null); // 待重命名的文件/目录
    const [renameName, setRenameName] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    // 上传状态
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('uploading'); // uploading | success | error
    const [uploadProgress, setUploadProgress] = useState(0); // 0 - 100
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const uploadingRef = useRef(false); // 用于 beforeunload 拦截判断
    // 下载状态
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState('downloading'); // downloading | success | error
    const [downloadProgress, setDownloadProgress] = useState(0); // 0 - 100
    const [downloadFileName, setDownloadFileName] = useState('');
    const [downloadMessage, setDownloadMessage] = useState('');
    const fileInputRef = useRef(null);

    // 切换 host 时回到家目录
    useEffect(() => {
        if (host) {
            setPath('~');
        }
    }, [host]);

    // 同步页面标题
    const { setTitle } = usePageTitle();
    useEffect(() => {
        if (!host) {
            setTitle('SSH 文件管理');
            document.title = 'SSH 文件管理';
        } else {
            const display = path === '/' ? host : `${host}${path}`;
            const breadcrumb = (
                <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">SSH 文件</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium">{display}</span>
                </div>
            );
            setTitle(breadcrumb);
            document.title = `SSH 文件 - ${display}`;
        }
        return () => setTitle(null);
    }, [host, path, setTitle]);

    const fetchList = useCallback(async () => {
        if (!host) return;
        setLoading(true);
        setSelected(null);
        try {
            const resp = await fetch(`/api/ssh/${encodeURIComponent(host)}/list?path=${encodeURIComponent(path)}`);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '读取目录失败');
                setItems([]);
                return;
            }
            // 服务端返回解析后的绝对路径（~ 会被解析为家目录）
            if (data.path && data.path !== path) {
                setPath(data.path);
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
        setDownloadFileName(item.name);
        setDownloadProgress(0);
        setDownloadStatus('downloading');
        setDownloadMessage('');
        setDownloadOpen(true);

        const url = `/api/ssh/${encodeURIComponent(host)}/download?path=${encodeURIComponent(joinPath(item.name))}`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const pct = Math.round((event.loaded / event.total) * 100);
                setDownloadProgress(pct);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                setDownloadProgress(100);
                setDownloadStatus('success');
                setDownloadMessage('下载成功');

                const blob = xhr.response;
                const a = document.createElement('a');
                const url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = item.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                let data;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (parseErr) {
                    data = { error: '响应解析失败' };
                }
                setDownloadStatus('error');
                setDownloadMessage(data.error || `下载失败（HTTP ${xhr.status}）`);
            }
        };

        xhr.onerror = () => {
            setDownloadStatus('error');
            setDownloadMessage('网络错误：下载请求失败');
        };

        xhr.send();
    };

    // 上传
    const onUploadClick = () => fileInputRef.current?.click();
    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // 重置并打开上传弹框
        setUploadFileName(file.name);
        setUploadProgress(0);
        setUploadStatus('uploading');
        setUploadMessage('');
        setUploadOpen(true);
        uploadingRef.current = true;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            // 将字节数组转为普通数组，便于 JSON 序列化
            const content = Array.from(bytes);
            const body = JSON.stringify({ path: joinPath(file.name), content });

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `/api/ssh/${encodeURIComponent(host)}/upload`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const pct = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(pct);
                    }
                };
                xhr.onload = () => {
                    let data;
                    try {
                        data = JSON.parse(xhr.responseText);
                    } catch (parseErr) {
                        data = { error: '响应解析失败' };
                    }
                    if (xhr.status >= 200 && xhr.status < 300 && !data.error) {
                        setUploadProgress(100);
                        setUploadStatus('success');
                        setUploadMessage('上传成功');
                        resolve(data);
                    } else {
                        setUploadStatus('error');
                        setUploadMessage(data.error || `上传失败（HTTP ${xhr.status}）`);
                        reject(new Error(data.error || '上传失败'));
                    }
                };
                xhr.onerror = () => {
                    setUploadStatus('error');
                    setUploadMessage('网络错误：上传请求失败');
                    reject(new Error('网络错误'));
                };
                xhr.send(body);
            });
            fetchList();
        } catch (err) {
            // 错误状态已在上面设置，这里不需要再 toast
            // 保留 catch 以避免未处理的 Promise 拒绝
        } finally {
            uploadingRef.current = false;
            e.target.value = '';
        }
    };

    // 上传中拦截页面刷新/关闭
    useEffect(() => {
        const handler = (e) => {
            if (uploadingRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // 删除
    const onDelete = async (item) => {
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const toastId = toast.loading(`正在删除 "${deleteTarget.name}"…`);
        try {
            const resp = await fetch(`/api/ssh/${encodeURIComponent(host)}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: joinPath(deleteTarget.name), isDir: deleteTarget.isDirectory }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '删除失败', { id: toastId });
                return;
            }
            toast.success('删除完成', { id: toastId });
            fetchList();
        } catch (err) {
            toast.error('删除失败：' + err.message, { id: toastId });
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    // 重命名
    const onRename = (item) => {
        setRenameTarget(item);
        setRenameName(item.name);
        setRenameOpen(true);
    };

    const confirmRename = async () => {
        if (!renameTarget) return;
        const newName = renameName.trim();
        if (!newName || newName === renameTarget.name) {
            setRenameOpen(false);
            return;
        }
        setRenameLoading(true);
        const toastId = toast.loading(`正在重命名 "${renameTarget.name}" 为 "${newName}"…`);
        try {
            const resp = await fetch(`/api/ssh/${encodeURIComponent(host)}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: joinPath(renameTarget.name), to: joinPath(newName) }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '重命名失败', { id: toastId });
                return;
            }
            toast.success('重命名成功', { id: toastId });
            fetchList();
        } catch (err) {
            toast.error('重命名失败：' + err.message, { id: toastId });
        } finally {
            setRenameLoading(false);
            setRenameOpen(false);
            setRenameTarget(null);
        }
    };

    // 新建目录
    const onMkdir = () => {
        setMkdirName('');
        setMkdirOpen(true);
    };

    const confirmMkdir = async () => {
        const name = mkdirName.trim();
        if (!name) return;
        setMkdirLoading(true);
        const toastId = toast.loading(`正在创建目录 "${name}"…`);
        try {
            const resp = await fetch(`/api/ssh/${encodeURIComponent(host)}/mkdir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: joinPath(name) }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '创建目录失败', { id: toastId });
                return;
            }
            toast.success('创建完成', { id: toastId });
            fetchList();
        } catch (err) {
            toast.error('创建失败：' + err.message, { id: toastId });
        } finally {
            setMkdirLoading(false);
            setMkdirOpen(false);
        }
    };

    // 面包屑分段
    const breadcrumbs = path.split('/').filter(Boolean);

    if (!host) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                请从顶部导航 SSH 下拉选择一个文件管理入口
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setPath('~')}
                    className="p-1.5 rounded-md border hover:bg-accent"
                    title="家目录"
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
                            <th className="text-left px-3 py-2 font-medium w-24 hidden sm:table-cell">权限</th>
                            <th className="text-right px-3 py-2 font-medium w-32">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                    加载中…
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                    空目录
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => {
                                        if (item.isDirectory) {
                                            enterDir(item);
                                        } else {
                                            setSelected(item);
                                        }
                                    }}
                                    className={`border-t cursor-pointer ${
                                        selected?.name === item.name ? 'bg-accent' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            {item.isDirectory ? (
                                                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                            ) : (
                                                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">
                                        {item.isDirectory ? '-' : formatSize(item.size)}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                                        {item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground text-xs hidden sm:table-cell">
                                        {item.permissions || '-'}
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
                提示：单击目录进入，单击文件选中
            </div>

            {/* 删除确认弹框 */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除{deleteTarget?.isDirectory ? '目录' : '文件'} &quot;{deleteTarget?.name}&quot;？
                            {deleteTarget?.isDirectory && '目录下所有内容将被一并删除。'}
                            此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? '删除中…' : '确认删除'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 新建目录弹框 */}
            <Dialog open={mkdirOpen} onOpenChange={(open) => { if (!open) setMkdirOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建目录</DialogTitle>
                        <DialogDescription>
                            在当前目录下创建新文件夹
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="请输入目录名称"
                        value={mkdirName}
                        onChange={(e) => setMkdirName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && mkdirName.trim()) confirmMkdir(); }}
                        disabled={mkdirLoading}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMkdirOpen(false)} disabled={mkdirLoading}>
                            取消
                        </Button>
                        <Button onClick={confirmMkdir} disabled={mkdirLoading || !mkdirName.trim()}>
                            {mkdirLoading ? '创建中…' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 重命名弹框 */}
            <Dialog open={renameOpen} onOpenChange={(open) => { if (!open) setRenameOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>重命名</DialogTitle>
                        <DialogDescription>
                            修改{renameTarget?.isDirectory ? '目录' : '文件'} &quot;{renameTarget?.name}&quot; 的名称
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="请输入新名称"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && renameName.trim()) confirmRename(); }}
                        disabled={renameLoading}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={renameLoading}>
                            取消
                        </Button>
                        <Button onClick={confirmRename} disabled={renameLoading || !renameName.trim() || renameName.trim() === renameTarget?.name}>
                            {renameLoading ? '修改中…' : '确认修改'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 上传状态弹框 */}
            <Dialog
                open={uploadOpen}
                onOpenChange={(open) => {
                    // 上传中禁止通过遮罩/ESC 关闭
                    if (!open && uploadStatus === 'uploading') return;
                    setUploadOpen(open);
                }}
            >
                <DialogContent
                    onPointerDownOutside={(e) => { if (uploadStatus === 'uploading') e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (uploadStatus === 'uploading') e.preventDefault(); }}
                >
                    <DialogHeader>
                        <DialogTitle>文件上传</DialogTitle>
                        <DialogDescription>
                            {uploadStatus === 'uploading'
                                ? `正在上传 "${uploadFileName}"，请勿关闭或刷新页面`
                                : uploadStatus === 'success'
                                    ? `"${uploadFileName}" 已上传成功`
                                    : `"${uploadFileName}" 上传失败`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* 进度条 */}
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full transition-all duration-200 ${
                                    uploadStatus === 'error' ? 'bg-destructive' : 'bg-primary'
                                }`}
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {uploadStatus === 'uploading' && '上传中…'}
                                {uploadStatus === 'success' && '上传完成'}
                                {uploadStatus === 'error' && '上传失败'}
                            </span>
                            <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        {uploadMessage && uploadStatus !== 'success' && (
                            <p className={`text-sm ${uploadStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {uploadMessage}
                            </p>
                        )}
                        {uploadStatus === 'uploading' && (
                            <p className="text-xs text-muted-foreground">
                                提示：当前正在上传，刷新或关闭页面会导致上传中断。
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        {/* 仅在上传成功或失败时显示确定按钮 */}
                        {uploadStatus !== 'uploading' && (
                            <Button onClick={() => setUploadOpen(false)}>
                                确定
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 下载状态弹框 */}
            <Dialog
                open={downloadOpen}
                onOpenChange={(open) => {
                    if (!open && downloadStatus === 'downloading') return;
                    setDownloadOpen(open);
                }}
            >
                <DialogContent
                    onPointerDownOutside={(e) => { if (downloadStatus === 'downloading') e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (downloadStatus === 'downloading') e.preventDefault(); }}
                >
                    <DialogHeader>
                        <DialogTitle>文件下载</DialogTitle>
                        <DialogDescription>
                            {downloadStatus === 'downloading'
                                ? `正在下载 "${downloadFileName}"`
                                : downloadStatus === 'success'
                                    ? `"${downloadFileName}" 已下载成功`
                                    : `"${downloadFileName}" 下载失败`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* 进度条 */}
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full transition-all duration-200 ${
                                    downloadStatus === 'error' ? 'bg-destructive' : 'bg-primary'
                                }`}
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {downloadStatus === 'downloading' && '下载中…'}
                                {downloadStatus === 'success' && '下载完成'}
                                {downloadStatus === 'error' && '下载失败'}
                            </span>
                            <span className="font-medium">{downloadProgress}%</span>
                        </div>
                        {downloadMessage && downloadStatus !== 'success' && (
                            <p className={`text-sm ${downloadStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {downloadMessage}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        {/* 仅在下载成功或失败时显示确定按钮 */}
                        {downloadStatus !== 'downloading' && (
                            <Button onClick={() => setDownloadOpen(false)}>
                                确定
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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
