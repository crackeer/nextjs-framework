'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Folder,
    Server,
    RefreshCw,
    Trash2,
    Edit3,
    RotateCcw,
    Plus,
    ChevronRight,
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
import { Textarea } from '../../../../components/ui/textarea';
import { usePageTitle } from '../../../../components/DashboardShell';

const RESOURCE_TYPES = [
    { key: 'deployments', label: 'Deployments' },
    { key: 'statefulsets', label: 'StatefulSets' },
    { key: 'daemonsets', label: 'DaemonSets' },
    { key: 'pods', label: 'Pods' },
    { key: 'services', label: 'Services' },
    { key: 'configmaps', label: 'ConfigMaps' },
    { key: 'secrets', label: 'Secrets' },
    { key: 'ingresses', label: 'Ingresses' },
    { key: 'persistentvolumeclaims', label: 'PVCs' },
    { key: 'persistentvolumes', label: 'PVs' },
    { key: 'replicasets', label: 'ReplicaSets' },
];

export default function K3sPage() {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
            <K3sPageInner />
        </Suspense>
    );
}

function K3sPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const cluster = searchParams.get('cluster');
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNamespace, setSelectedNamespace] = useState('default');
    const [selectedResourceType, setSelectedResourceType] = useState('deployments');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editYaml, setEditYaml] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createYaml, setCreateYaml] = useState('');

    const { setTitle } = usePageTitle();

    useEffect(() => {
        if (!cluster) {
            setTitle('K3S 集群管理');
        } else {
            setTitle(`K3S - ${cluster}`);
        }
    }, [cluster, setTitle]);

    const fetchNamespaces = useCallback(async () => {
        if (!cluster) return;
        try {
            const resp = await fetch(`/api/k3s/${encodeURIComponent(cluster)}/namespaces`);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '获取命名空间失败');
                return;
            }
            setNamespaces(data.namespaces || []);
        } catch (err) {
            toast.error('获取命名空间错误：' + err.message);
        }
    }, [cluster]);

    const fetchResources = useCallback(async () => {
        if (!cluster) return;
        setLoading(true);
        try {
            const resp = await fetch(`/api/k3s/${encodeURIComponent(cluster)}/${encodeURIComponent(selectedNamespace)}/${selectedResourceType}`);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '获取资源失败');
                setResources([]);
                return;
            }
            setResources(data.resources || []);
        } catch (err) {
            toast.error('获取资源错误：' + err.message);
            setResources([]);
        } finally {
            setLoading(false);
        }
    }, [cluster, selectedNamespace, selectedResourceType]);

    useEffect(() => {
        fetchNamespaces();
    }, [fetchNamespaces]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const handleNamespaceChange = (ns) => {
        setSelectedNamespace(ns);
    };

    const handleResourceTypeChange = (type) => {
        setSelectedResourceType(type);
    };

    const handleRefresh = () => {
        fetchResources();
    };

    const handleDelete = (resource) => {
        setDeleteTarget(resource);
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !cluster) return;
        setDeleting(true);
        const toastId = toast.loading(`正在删除 "${deleteTarget.metadata.name}"…`);
        try {
            const resp = await fetch(
                `/api/k3s/${encodeURIComponent(cluster)}/${encodeURIComponent(selectedNamespace)}/${selectedResourceType}/${encodeURIComponent(deleteTarget.metadata.name)}`,
                { method: 'DELETE' }
            );
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '删除失败', { id: toastId });
                return;
            }
            toast.success('删除完成', { id: toastId });
            fetchResources();
        } catch (err) {
            toast.error('删除失败：' + err.message, { id: toastId });
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleEdit = async (resource) => {
        setEditTarget(resource);
        try {
            setEditYaml(JSON.stringify(resource, null, 2));
        } catch {
            setEditYaml('');
        }
    };

    const confirmEdit = async () => {
        if (!editTarget || !cluster) return;
        setEditLoading(true);
        const toastId = toast.loading(`正在更新 "${editTarget.metadata.name}"…`);
        try {
            let body;
            try {
                body = JSON.parse(editYaml);
            } catch {
                toast.error('YAML 格式错误', { id: toastId });
                setEditLoading(false);
                return;
            }
            const resp = await fetch(
                `/api/k3s/${encodeURIComponent(cluster)}/${encodeURIComponent(selectedNamespace)}/${selectedResourceType}/${encodeURIComponent(editTarget.metadata.name)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }
            );
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '更新失败', { id: toastId });
                return;
            }
            toast.success('更新完成', { id: toastId });
            fetchResources();
            setEditTarget(null);
        } catch (err) {
            toast.error('更新失败：' + err.message, { id: toastId });
        } finally {
            setEditLoading(false);
        }
    };

    const handleRollout = async (resource) => {
        if (!cluster) return;
        const toastId = toast.loading(`正在重启 "${resource.metadata.name}"…`);
        try {
            const resp = await fetch(
                `/api/k3s/${encodeURIComponent(cluster)}/${encodeURIComponent(selectedNamespace)}/${selectedResourceType}/${encodeURIComponent(resource.metadata.name)}?action=rollout`,
                { method: 'POST' }
            );
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '重启失败', { id: toastId });
                return;
            }
            toast.success('重启完成', { id: toastId });
            fetchResources();
        } catch (err) {
            toast.error('重启失败：' + err.message, { id: toastId });
        }
    };

    const handleCreate = () => {
        setCreateYaml('');
        setCreateOpen(true);
    };

    const confirmCreate = async () => {
        if (!cluster) return;
        setCreateLoading(true);
        const toastId = toast.loading('正在创建资源…');
        try {
            let body;
            try {
                body = JSON.parse(createYaml);
            } catch {
                toast.error('YAML 格式错误', { id: toastId });
                setCreateLoading(false);
                return;
            }
            const resp = await fetch(
                `/api/k3s/${encodeURIComponent(cluster)}/${encodeURIComponent(selectedNamespace)}/${selectedResourceType}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }
            );
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '创建失败', { id: toastId });
                return;
            }
            toast.success('创建成功', { id: toastId });
            fetchResources();
            setCreateOpen(false);
        } catch (err) {
            toast.error('创建失败：' + err.message, { id: toastId });
        } finally {
            setCreateLoading(false);
        }
    };

    if (!cluster) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                请从顶部导航 K3s 下拉选择一个集群
            </div>
        );
    }

    const renderResourceRow = (resource) => {
        const name = resource.metadata.name;
        const namespace = resource.metadata.namespace || '-';
        const labels = resource.metadata.labels || {};
        const creationTime = resource.metadata.creationTimestamp;

        let status = '-';
        if (resource.status) {
            if (selectedResourceType === 'deployments') {
                const ready = resource.status.readyReplicas || 0;
                const total = resource.status.replicas || 0;
                status = `${ready}/${total} Ready`;
            } else if (selectedResourceType === 'pods') {
                status = resource.status.phase || '-';
            } else if (selectedResourceType === 'services') {
                status = resource.spec.type || '-';
            } else if (selectedResourceType === 'statefulsets') {
                const ready = resource.status.readyReplicas || 0;
                const total = resource.status.replicas || 0;
                status = `${ready}/${total} Ready`;
            } else if (selectedResourceType === 'daemonsets') {
                const ready = resource.status.numberReady || 0;
                const total = resource.status.desiredNumberScheduled || 0;
                status = `${ready}/${total} Ready`;
            }
        }

        return (
            <tr key={`${namespace}-${name}`} className="border-t hover:bg-accent/50">
                <td className="px-3 py-2">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{namespace}</div>
                </td>
                <td className="px-3 py-2 text-sm text-muted-foreground">
                    {Object.keys(labels).slice(0, 3).map((key) => (
                        <span key={key} className="inline-block mr-2 px-1.5 py-0.5 bg-muted rounded text-xs">
                            {key}={labels[key]}
                        </span>
                    ))}
                    {Object.keys(labels).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{Object.keys(labels).length - 3}</span>
                    )}
                </td>
                <td className="px-3 py-2 text-sm">{status}</td>
                <td className="px-3 py-2 text-sm text-muted-foreground">
                    {creationTime ? new Date(creationTime).toLocaleString() : '-'}
                </td>
                <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => handleEdit(resource)}
                            className="p-1 rounded hover:bg-accent-foreground/10"
                            title="编辑"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {selectedResourceType === 'deployments' && (
                            <button
                                onClick={() => handleRollout(resource)}
                                className="p-1 rounded hover:bg-accent-foreground/10"
                                title="重启"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button
                            onClick={() => handleDelete(resource)}
                            className="p-1 rounded hover:bg-destructive/10 text-destructive"
                            title="删除"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-120px)]">
            {/* 侧边栏 */}
            <aside className="w-56 flex-shrink-0 border rounded-md overflow-hidden flex flex-col">
                {/* 侧边栏头部 */}
                <div className="px-3 py-2 bg-muted/50 border-b">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Server className="h-4 w-4" />
                        <span>{cluster}</span>
                    </div>
                </div>

                {/* Namespace 列表 */}
                <div className="p-2 border-b">
                    <div className="text-xs text-muted-foreground font-medium px-1 mb-1">Namespaces</div>
                    <div className="space-y-0.5">
                        {namespaces.map((ns) => (
                            <button
                                key={ns.name}
                                onClick={() => handleNamespaceChange(ns.name)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
                                    selectedNamespace === ns.name
                                        ? 'bg-[#3eb489] text-white'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <Folder className="h-3 w-3" />
                                <span className="truncate">{ns.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 资源类型列表 */}
                <div className="flex-1 p-2 overflow-y-auto">
                    <div className="text-xs text-muted-foreground font-medium px-1 mb-1">Resources</div>
                    <div className="space-y-0.5">
                        {RESOURCE_TYPES.map((type) => (
                            <button
                                key={type.key}
                                onClick={() => handleResourceTypeChange(type.key)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                                    selectedResourceType === type.key
                                        ? 'bg-[#3eb489] text-white'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <span>{type.label}</span>
                                <ChevronRight className={`h-3 w-3 ${selectedResourceType === type.key ? 'rotate-90' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 border rounded-md overflow-hidden flex flex-col">
                {/* 工具栏 */}
                <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {RESOURCE_TYPES.find((t) => t.key === selectedResourceType)?.label || selectedResourceType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({selectedNamespace})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="p-1.5 rounded hover:bg-accent"
                            title="刷新"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <Button size="sm" onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-1" />
                            创建
                        </Button>
                    </div>
                </div>

                {/* 列表 */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                            <tr>
                                <th className="text-left px-3 py-2 font-medium">名称 / 命名空间</th>
                                <th className="text-left px-3 py-2 font-medium">标签</th>
                                <th className="text-left px-3 py-2 font-medium">状态</th>
                                <th className="text-left px-3 py-2 font-medium">创建时间</th>
                                <th className="text-right px-3 py-2 font-medium w-24">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                        加载中…
                                    </td>
                                </tr>
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                        暂无资源
                                    </td>
                                </tr>
                            ) : (
                                resources.map(renderResourceRow)
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* 删除确认弹框 */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除 {selectedResourceType} &quot;{deleteTarget?.metadata.name}&quot;？
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

            {/* 编辑弹框 */}
            <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>编辑 {selectedResourceType}</DialogTitle>
                        <DialogDescription>
                            修改 &quot;{editTarget?.metadata.name}&quot; 的配置
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={editYaml}
                        onChange={(e) => setEditYaml(e.target.value)}
                        disabled={editLoading}
                        className="font-mono text-xs h-80"
                        placeholder="输入 YAML/JSON 格式的配置"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>
                            取消
                        </Button>
                        <Button onClick={confirmEdit} disabled={editLoading}>
                            {editLoading ? '更新中…' : '确认更新'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 创建弹框 */}
            <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>创建 {selectedResourceType}</DialogTitle>
                        <DialogDescription>
                            在命名空间 &quot;{selectedNamespace}&quot; 下创建新资源
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={createYaml}
                        onChange={(e) => setCreateYaml(e.target.value)}
                        disabled={createLoading}
                        className="font-mono text-xs h-80"
                        placeholder="输入 YAML/JSON 格式的配置"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>
                            取消
                        </Button>
                        <Button onClick={confirmCreate} disabled={createLoading}>
                            {createLoading ? '创建中…' : '确认创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}