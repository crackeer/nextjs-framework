'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { usePageTitle } from '../../../components/DashboardShell';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Plus, Trash2, Edit3, Copy, Play, Save, FolderOpen } from 'lucide-react';
import JSONEditorX from '../../../component/JSONEditor';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const STORAGE_KEY = 'http-requests';

function getStoredRequests() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveRequests(requests) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch { /* ignore */ }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function parseQueryParamsFromUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const params = [];
        parsedUrl.searchParams.forEach((value, key) => {
            params.push({ key, value });
        });
        return params.length > 0 ? params : [{ key: '', value: '' }];
    } catch {
        return [{ key: '', value: '' }];
    }
}

const DEFAULT_REQUEST = {
    id: generateId(),
    name: '',
    method: 'GET',
    url: '',
    queryParams: [{ key: '', value: '' }],
    headers: [{ key: '', value: '' }],
    body: '',
    bodyType: 'json',
    formData: [{ key: '', value: '' }],
};

function KeyValueRow({ item, onChange, onRemove, keyPlaceholder, valuePlaceholder }) {
    return (
        <div className="flex items-center gap-1">
            <Input
                placeholder={keyPlaceholder}
                value={item.key}
                onChange={(e) => onChange({ ...item, key: e.target.value })}
                className="flex-1 h-8 px-2 py-1.5 text-sm"
            />
            <Input
                placeholder={valuePlaceholder}
                value={item.value}
                onChange={(e) => onChange({ ...item, value: e.target.value })}
                className="flex-1 h-8 px-2 py-1.5 text-sm"
            />
            <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function RequestList({ requests, selectedId, onSelect, onDelete, onEdit, onNewRequest }) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">请求列表</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{requests.length} 个请求</span>
                    <button
                        onClick={onNewRequest}
                        className="px-3 py-1 text-sm rounded border hover:bg-accent transition-colors flex items-center gap-1"
                        title="新建请求"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        新建请求
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                        <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                        <span>暂无请求</span>
                        <span className="text-xs">点击上方按钮创建</span>
                    </div>
                ) : (
                    <div className="py-1">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors group ${
                                    selectedId === req.id
                                        ? 'bg-[#3eb489] text-white'
                                        : 'hover:bg-accent'
                                }`}
                                onClick={() => onSelect(req)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                selectedId === req.id
                                                    ? 'bg-white/20'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            {req.method}
                                        </span>
                                        <span className="text-sm truncate">
                                            {req.name || req.url || '未命名请求'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(req);
                                            }}
                                            className={`p-1 rounded hover:bg-white/10 ${
                                                selectedId === req.id ? 'text-white/80' : 'text-gray-400'
                                            }`}
                                            title="编辑"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(req.id);
                                            }}
                                            className={`p-1 rounded hover:bg-destructive/10 text-destructive ${
                                                selectedId === req.id ? 'text-red-200' : ''
                                            }`}
                                            title="删除"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {req.url && (
                                    <div
                                        className={`text-xs truncate mt-0.5 ${
                                            selectedId === req.id ? 'text-white/60' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {req.url}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ResponseViewer({ response }) {
    const editorRef = useRef(null);

    useEffect(() => {
        if (response) {
            if (response.contentType?.includes('application/json')) {
                if (typeof response.data === 'object') {
                    editorRef.current?.set(response.data);
                } else {
                    try {
                        editorRef.current?.set(JSON.parse(response.data));
                    } catch {
                        editorRef.current?.setText(response.data);
                    }
                }
            }
        }
    }, [response]);

    if (!response) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                点击发送按钮发起请求
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm font-bold px-2 py-0.5 rounded ${
                            response.status >= 200 && response.status < 300
                                ? 'bg-green-100 text-green-700'
                                : response.status >= 400
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                        {response.status} {response.statusText}
                    </span>
                    <span className="text-xs text-muted-foreground">{response.contentType}</span>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        const text = typeof response.data === 'object'
                            ? JSON.stringify(response.data, null, 2)
                            : String(response.data);
                        navigator.clipboard.writeText(text).then(() => {
                            toast.success('已复制响应内容');
                        }).catch(() => {
                            toast.error('复制失败');
                        });
                    }}
                >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    复制
                </Button>
            </div>
            <div className="flex-1 overflow-auto">
                {response.contentType?.includes('application/json') ? (
                    <JSONEditorX
                        ref={editorRef}
                        height="100%"
                        json={typeof response.data === 'object' ? response.data : {}}
                    />
                ) : response.contentType?.includes('text/') ? (
                    <div className="p-3 h-full">
                        <Textarea
                            value={String(response.data)}
                            readOnly
                            className="h-full font-mono text-sm resize-none"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        二进制数据（{response.data?.length || 0} 字节）
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Page() {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle('HTTP 请求');
        document.title = 'HTTP 请求';
        return () => setTitle(null);
    }, [setTitle]);

    const [requests, setRequests] = useState(getStoredRequests);
    const [currentRequest, setCurrentRequest] = useState({ ...DEFAULT_REQUEST });
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editTarget, setEditTarget] = useState(null);
    const [activeTab, setActiveTab] = useState('query');
    const [responseHeight, setResponseHeight] = useState(300);
    const bodyEditorRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        saveRequests(requests);
    }, [requests]);

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newHeight = Math.max(100, Math.min(600, responseHeight + e.movementY));
            setResponseHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, responseHeight]);

    const handleSelect = useCallback((req) => {
        setCurrentRequest({ ...req });
        setResponse(null);
    }, []);

    const handleDelete = useCallback((id) => {
        const newRequests = requests.filter((r) => r.id !== id);
        setRequests(newRequests);
        if (currentRequest.id === id) {
            setCurrentRequest({ ...DEFAULT_REQUEST, id: generateId() });
            setResponse(null);
        }
        toast.success('请求已删除');
    }, [requests, currentRequest.id]);

    const handleEdit = useCallback((req) => {
        setEditTarget(req);
        setEditName(req.name);
        setEditOpen(true);
    }, []);

    const handleSaveName = useCallback(() => {
        if (!editTarget) return;
        const newRequests = requests.map((r) =>
            r.id === editTarget.id ? { ...r, name: editName.trim() } : r
        );
        setRequests(newRequests);
        if (currentRequest.id === editTarget.id) {
            setCurrentRequest({ ...currentRequest, name: editName.trim() });
        }
        setEditOpen(false);
        toast.success('名称已保存');
    }, [editTarget, editName, requests, currentRequest]);

    const handleNewRequest = useCallback(() => {
        const newRequest = { ...DEFAULT_REQUEST };
        setCurrentRequest(newRequest);
        setResponse(null);
    }, []);

    const handleSaveRequest = useCallback(() => {
        let bodyContent = currentRequest.body;
        let formDataContent = currentRequest.formData;
        
        if (currentRequest.bodyType === 'json') {
            const jsonData = bodyEditorRef.current?.get();
            bodyContent = jsonData ? JSON.stringify(jsonData, null, 2) : '';
        }
        
        const reqToSave = {
            ...currentRequest,
            body: bodyContent,
            formData: formDataContent,
            name: currentRequest.name || (currentRequest.url ? `请求 ${requests.length + 1}` : ''),
        };

        const exists = requests.find((r) => r.id === currentRequest.id);
        if (exists) {
            const newRequests = requests.map((r) =>
                r.id === currentRequest.id ? reqToSave : r
            );
            setRequests(newRequests);
            toast.success('请求已更新');
        } else {
            setRequests([...requests, reqToSave]);
            toast.success('请求已保存');
        }
    }, [currentRequest, requests]);

    const handleSend = useCallback(async () => {
        if (!currentRequest.url.trim()) {
            toast.error('请输入 URL');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const headers = currentRequest.headers
                .filter((h) => h.key.trim())
                .reduce((acc, h) => {
                    acc[h.key.trim()] = h.value.trim();
                    return acc;
                }, {});

            const queryParams = currentRequest.queryParams
                .filter((q) => q.key.trim())
                .reduce((acc, q) => {
                    acc[q.key.trim()] = q.value.trim();
                    return acc;
                }, {});

            let bodyData;
            let contentType = currentRequest.bodyType === 'json' ? 'application/json' : 
                              currentRequest.bodyType === 'formdata' ? 'application/x-www-form-urlencoded' : 
                              'text/plain';
            
            if (currentRequest.bodyType === 'json') {
                bodyData = bodyEditorRef.current?.get() || {};
            } else if (currentRequest.bodyType === 'formdata') {
                bodyData = currentRequest.formData
                    .filter((f) => f.key.trim())
                    .reduce((acc, f) => {
                        acc[f.key.trim()] = f.value.trim();
                        return acc;
                    }, {});
            } else {
                bodyData = currentRequest.body;
            }

            const resp = await fetch('/api/http/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: currentRequest.method,
                    url: currentRequest.url.trim(),
                    queryParams,
                    headers,
                    data: bodyData,
                    contentType,
                }),
            });

            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '请求失败');
                return;
            }

            setResponse(data);
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentRequest]);

    return (
        <div className="min-h-[calc(100vh-6rem)] flex flex-col gap-4">
            

            <div className="flex-1 flex gap-4">
                <div className="w-72 border rounded-md overflow-hidden shrink-0 h-fit">
                    <RequestList
                        requests={requests}
                        selectedId={currentRequest.id}
                        onSelect={handleSelect}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onNewRequest={handleNewRequest}
                    />
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col border rounded-md">
                        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/50">
                            <select
                                value={currentRequest.method}
                                onChange={(e) => setCurrentRequest({ ...currentRequest, method: e.target.value })}
                                className="px-2 py-1 rounded border text-sm font-medium shrink-0"
                            >
                                {HTTP_METHODS.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <Input
                                value={currentRequest.url}
                                onChange={(e) => {
                                    const newUrl = e.target.value;
                                    try {
                                        const parsedUrl = new URL(newUrl);
                                        const cleanUrl = parsedUrl.origin + parsedUrl.pathname;
                                        const params = [];
                                        parsedUrl.searchParams.forEach((value, key) => {
                                            params.push({ key, value });
                                        });
                                        setCurrentRequest({ 
                                            ...currentRequest, 
                                            url: cleanUrl,
                                            queryParams: params.length > 0 ? params : [{ key: '', value: '' }]
                                        });
                                    } catch {
                                        setCurrentRequest({ ...currentRequest, url: newUrl });
                                    }
                                }}
                                placeholder="输入请求 URL"
                                className="flex-1 min-w-0 h-8 px-2 py-1.5 text-sm"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={loading}
                                size="sm"
                                className="bg-[#3eb489] hover:bg-[#3eb489]/90 shrink-0"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        发送中
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Play className="h-3.5 w-3.5" />
                                        发送
                                    </span>
                                )}
                            </Button>
                            <Button
                                onClick={handleSaveRequest}
                                variant="outline"
                                size="sm"
                                title="保存请求"
                                className="shrink-0"
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex border-b mx-3 mt-3">
                                <button
                                    onClick={() => setActiveTab('query')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'query'
                                            ? 'border-[#3eb489] text-[#3eb489]'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Query Params
                                </button>
                                <button
                                    onClick={() => setActiveTab('headers')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'headers'
                                            ? 'border-[#3eb489] text-[#3eb489]'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Headers
                                </button>
                                <button
                                    onClick={() => setActiveTab('body')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'body'
                                            ? 'border-[#3eb489] text-[#3eb489]'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Body
                                </button>
                            </div>

                            <div>
                                {activeTab === 'query' && (
                                    <div className="p-3 space-y-2">
                                        {currentRequest.queryParams.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">
                                                暂无 Query 参数，点击下方按钮添加
                                            </div>
                                        ) : (
                                            currentRequest.queryParams.map((param, idx) => (
                                                <KeyValueRow
                                                    key={idx}
                                                    item={param}
                                                    keyPlaceholder="参数名"
                                                    valuePlaceholder="参数值"
                                                    onChange={(updated) => {
                                                        const newParams = [...currentRequest.queryParams];
                                                        newParams[idx] = updated;
                                                        setCurrentRequest({ ...currentRequest, queryParams: newParams });
                                                    }}
                                                    onRemove={() => {
                                                        const newParams = currentRequest.queryParams.filter((_, i) => i !== idx);
                                                        setCurrentRequest({ ...currentRequest, queryParams: newParams });
                                                    }}
                                                />
                                            ))
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setCurrentRequest({
                                                    ...currentRequest,
                                                    queryParams: [...currentRequest.queryParams, { key: '', value: '' }],
                                                });
                                            }}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            添加参数
                                        </Button>
                                    </div>
                                )}

                                {activeTab === 'headers' && (
                                    <div className="p-3 space-y-2">
                                        {currentRequest.headers.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">
                                                暂无请求头，点击下方按钮添加
                                            </div>
                                        ) : (
                                            currentRequest.headers.map((header, idx) => (
                                                <KeyValueRow
                                                    key={idx}
                                                    item={header}
                                                    keyPlaceholder="Header 名称"
                                                    valuePlaceholder="Header 值"
                                                    onChange={(updated) => {
                                                        const newHeaders = [...currentRequest.headers];
                                                        newHeaders[idx] = updated;
                                                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                                                    }}
                                                    onRemove={() => {
                                                        const newHeaders = currentRequest.headers.filter((_, i) => i !== idx);
                                                        setCurrentRequest({ ...currentRequest, headers: newHeaders });
                                                    }}
                                                />
                                            ))
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setCurrentRequest({
                                                    ...currentRequest,
                                                    headers: [...currentRequest.headers, { key: '', value: '' }],
                                                });
                                            }}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            添加 Header
                                        </Button>
                                    </div>
                                )}

                                {activeTab === 'body' && (
                                    <div className="p-3 flex gap-3 h-full">
                                        <div className="shrink-0 flex flex-col justify-start">
                                            <span className="text-xs text-muted-foreground mb-1">数据类型</span>
                                            <select
                                                value={currentRequest.bodyType}
                                                onChange={(e) => setCurrentRequest({ ...currentRequest, bodyType: e.target.value })}
                                                className="px-2 py-1 rounded border text-sm"
                                            >
                                                <option value="json">JSON</option>
                                                <option value="text">Text</option>
                                                <option value="formdata">Form Data</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            {currentRequest.bodyType === 'json' ? (
                                                <JSONEditorX
                                                    ref={bodyEditorRef}
                                                    height="100%"
                                                    json={currentRequest.body ? JSON.parse(currentRequest.body) : {}}
                                                />
                                            ) : currentRequest.bodyType === 'formdata' ? (
                                                <div className="space-y-2">
                                                    {currentRequest.formData.length === 0 ? (
                                                        <div className="text-sm text-muted-foreground">
                                                            暂无 Form Data，点击下方按钮添加
                                                        </div>
                                                    ) : (
                                                        currentRequest.formData.map((param, idx) => (
                                                            <KeyValueRow
                                                                key={idx}
                                                                item={param}
                                                                keyPlaceholder="参数名"
                                                                valuePlaceholder="参数值"
                                                                onChange={(updated) => {
                                                                    const newData = [...currentRequest.formData];
                                                                    newData[idx] = updated;
                                                                    setCurrentRequest({ ...currentRequest, formData: newData });
                                                                }}
                                                                onRemove={() => {
                                                                    const newData = currentRequest.formData.filter((_, i) => i !== idx);
                                                                    setCurrentRequest({ ...currentRequest, formData: newData });
                                                                }}
                                                            />
                                                        ))
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setCurrentRequest({
                                                                ...currentRequest,
                                                                formData: [...currentRequest.formData, { key: '', value: '' }],
                                                            });
                                                        }}
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                                        添加参数
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Textarea
                                                    value={currentRequest.body}
                                                    onChange={(e) => setCurrentRequest({ ...currentRequest, body: e.target.value })}
                                                    placeholder="输入请求体内容"
                                                    className="h-full font-mono text-sm px-2 py-1.5"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col border rounded-md overflow-hidden" style={{ height: responseHeight }}>
                        <ResponseViewer response={response} />
                        <div
                            className={`h-1 bg-muted hover:bg-muted-foreground/50 cursor-ns-resize flex items-center justify-center transition-colors ${isDragging ? 'bg-muted-foreground' : ''}`}
                            onMouseDown={handleMouseDown}
                        >
                            <div className="w-6 h-0.5 bg-muted-foreground/50 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={editOpen} onOpenChange={(v) => { if (!v) setEditOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑请求名称</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="输入请求名称"
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
                        <Button onClick={handleSaveName}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}