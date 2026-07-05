'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import {
    Table,
    Search,
    Database,
    RefreshCw,
    Play,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { usePageTitle } from '../../../components/DashboardShell';

export default function MySqlPage() {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
            <MySqlPageInner />
        </Suspense>
    );
}

function MySqlPageInner() {
    const searchParams = useSearchParams();
    const host = searchParams.get('host');
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableData, setTableData] = useState(null);
    const [executeLoading, setExecuteLoading] = useState(false);
    const [executeResult, setExecuteResult] = useState(null);
    const [sqlValue, setSqlValue] = useState('');
    const [activeTab, setActiveTab] = useState('structure');
    const [database, setDatabase] = useState('');

    const { setTitle } = usePageTitle();

    useEffect(() => {
        if (!host) {
            setTitle('MySQL 管理');
            document.title = 'MySQL 管理';
        } else {
            const breadcrumb = (
                <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">MySQL</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium">{host}</span>
                    {database && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-medium">{database}</span>
                        </>
                    )}
                </div>
            );
            setTitle(breadcrumb);
            document.title = `MySQL - ${host}`;
        }
        return () => setTitle(null);
    }, [host, database, setTitle]);

    const fetchTables = useCallback(async () => {
        if (!host) return;
        setLoading(true);
        try {
            const url = `/api/mysql/${encodeURIComponent(host)}/tables`;
            const resp = await fetch(searchTerm ? `${url}?search=${encodeURIComponent(searchTerm)}` : url);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '获取表列表失败');
                return;
            }
            setTables(data.tables || []);
            setDatabase(data.database || '');
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setLoading(false);
        }
    }, [host, searchTerm]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const fetchTableDetail = useCallback(async (tableName) => {
        if (!host) return;
        setTableLoading(true);
        try {
            const resp = await fetch(`/api/mysql/${encodeURIComponent(host)}/table/${encodeURIComponent(tableName)}`);
            const data = await resp.json();
            if (!resp.ok) {
                toast.error(data.error || '获取表详情失败');
                return;
            }
            setTableData(data);
            setSqlValue(`SELECT * FROM \`${tableName}\` LIMIT 1000;`);
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setTableLoading(false);
        }
    }, [host]);

    useEffect(() => {
        if (selectedTable) {
            fetchTableDetail(selectedTable);
        }
    }, [selectedTable, fetchTableDetail]);

    const handleExecuteSql = async () => {
        if (!host || !sqlValue.trim()) return;
        setExecuteLoading(true);
        try {
            const resp = await fetch(`/api/mysql/${encodeURIComponent(host)}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sqlValue }),
            });
            const data = await resp.json();
            if (data.success) {
                toast.success(data.message);
                setExecuteResult({
                    success: true,
                    data: data.data,
                    columnNames: data.columnNames,
                    message: data.message,
                });
                setActiveTab('sql');
            } else {
                toast.error(data.error);
                setExecuteResult({
                    success: false,
                    error: data.error,
                });
                setActiveTab('sql');
            }
        } catch (err) {
            toast.error('网络错误：' + err.message);
        } finally {
            setExecuteLoading(false);
        }
    };

    const handleDoubleClickTable = (tableName) => {
        setSelectedTable(tableName);
        setActiveTab('structure');
    };

    const filteredTables = tables.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!host) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                请从顶部导航 MySQL 下拉选择一个数据库连接
            </div>
        );
    }

    const renderStructure = () => {
        if (!tableData) return null;
        return (
            <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                    <div className="px-3 py-2 bg-muted text-xs font-medium">
                        DESCRIBE TABLE
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-3 py-2 font-medium">字段名</th>
                                <th className="text-left px-3 py-2 font-medium">类型</th>
                                <th className="text-left px-3 py-2 font-medium">可为空</th>
                                <th className="text-left px-3 py-2 font-medium">键</th>
                                <th className="text-left px-3 py-2 font-medium">默认值</th>
                                <th className="text-left px-3 py-2 font-medium">额外</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.describe.map((col, idx) => (
                                <tr key={idx} className="border-t hover:bg-accent/30">
                                    <td className="px-3 py-2 font-medium">{col.field}</td>
                                    <td className="px-3 py-2">{col.type}</td>
                                    <td className="px-3 py-2">{col.null ? 'YES' : 'NO'}</td>
                                    <td className="px-3 py-2">{col.key}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{col.default || '-'}</td>
                                    <td className="px-3 py-2">{col.extra}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border rounded-md overflow-hidden">
                    <div className="px-3 py-2 bg-muted text-xs font-medium">
                        CREATE TABLE
                    </div>
                    <pre className="p-4 text-sm overflow-x-auto bg-muted/30">
                        {tableData.createTable}
                    </pre>
                </div>
            </div>
        );
    };

    const renderData = () => {
        if (!tableData) return null;
        return (
            <div className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-muted text-xs font-medium">
                    数据（前 {tableData.total} 条）
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {tableData.columnNames.map((col) => (
                                    <th key={col} className="text-left px-3 py-2 font-medium">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.data.map((row, idx) => (
                                <tr key={idx} className="border-t hover:bg-accent/30">
                                    {tableData.columnNames.map((col) => (
                                        <td key={col} className="px-3 py-2">
                                            <span className="max-w-[200px] truncate" title={String(row[col])}>
                                                {row[col] === null ? 'NULL' : String(row[col])}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSqlResult = () => {
        if (!executeResult) {
            return (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    请在下方输入 SQL 并执行
                </div>
            );
        }

        if (!executeResult.success) {
            return (
                <div className="border rounded-md p-4 bg-red-50 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-600">{executeResult.error}</span>
                </div>
            );
        }

        if (!executeResult.data || executeResult.data.length === 0) {
            return (
                <div className="border rounded-md p-4 bg-green-50 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{executeResult.message}</span>
                </div>
            );
        }

        return (
            <div className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-muted text-xs font-medium flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    {executeResult.message}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {executeResult.columnNames.map((col) => (
                                    <th key={col} className="text-left px-3 py-2 font-medium">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {executeResult.data.map((row, idx) => (
                                <tr key={idx} className="border-t hover:bg-accent/30">
                                    {executeResult.columnNames.map((col) => (
                                        <td key={col} className="px-3 py-2">
                                            <span className="max-w-[200px] truncate" title={String(row[col])}>
                                                {row[col] === null ? 'NULL' : String(row[col])}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-110px)] gap-3">
            <div className="w-72 shrink-0 border rounded-md flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">表列表</span>
                    </div>
                    <button
                        onClick={fetchTables}
                        className="p-1 hover:bg-accent rounded"
                        title="刷新"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="搜索表名…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            加载中…
                        </div>
                    ) : filteredTables.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            {searchTerm ? '未找到匹配的表' : '暂无数据表'}
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredTables.map((table) => (
                                <button
                                    key={table.name}
                                    onClick={() => handleDoubleClickTable(table.name)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                                        selectedTable === table.name
                                            ? 'bg-accent font-medium'
                                            : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <Table className="h-4 w-4 text-gray-500 shrink-0" />
                                    <span className="text-sm truncate">{table.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 border rounded-md flex flex-col min-w-0">
                {!selectedTable ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        请从左侧选择一个表
                    </div>
                ) : (
                    <>
                        <div className="p-3 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Table className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">表: {selectedTable}</span>
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
                                <TabsList className="bg-muted">
                                    <TabsTrigger value="structure" className="text-xs">表结构</TabsTrigger>
                                    <TabsTrigger value="data" className="text-xs">数据</TabsTrigger>
                                    <TabsTrigger value="sql" className="text-xs">SQL 结果</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {tableLoading ? (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    加载中…
                                </div>
                            ) : (
                                <TabsContent value="structure" className="mt-0">
                                    {renderStructure()}
                                </TabsContent>
                            )}
                            {!tableLoading && (
                                <>
                                    <TabsContent value="data" className="mt-0">
                                        {renderData()}
                                    </TabsContent>
                                    <TabsContent value="sql" className="mt-0">
                                        {renderSqlResult()}
                                    </TabsContent>
                                </>
                            )}
                        </div>

                        <div className="border-t p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 border rounded-md overflow-hidden">
                                    <Editor
                                        height="120px"
                                        language="sql"
                                        value={sqlValue}
                                        onChange={(value) => setSqlValue(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={handleExecuteSql}
                                    disabled={executeLoading || !sqlValue.trim()}
                                    className="shrink-0"
                                >
                                    {executeLoading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">执行</span>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
