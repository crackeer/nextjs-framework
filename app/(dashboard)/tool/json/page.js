'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import JSONEditorX from '../../../../component/JSONEditor';
import { usePageTitle } from '../../../../components/DashboardShell';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';
import { superDecode, jsonToGo } from '../../../../lib/json-tools';

const DEFAULT_JSON = {};

function getLocalJSON() {
    try {
        const raw = localStorage.getItem('json-local-value') || '';
        return JSON.parse(raw);
    } catch {
        return DEFAULT_JSON;
    }
}

function setLocalJSON(value) {
    try {
        localStorage.setItem('json-local-value', JSON.stringify(value));
    } catch { /* ignore */ }
}

// ── Go 结构体弹窗 ──────────────────────────────────────────
function GoStructModal({ open, onClose, goCode }) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(goCode).then(() => {
            toast.success('已复制到剪贴板');
        }).catch(() => {
            toast.error('复制失败');
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Go 结构体</DialogTitle>
                </DialogHeader>
                <div className="relative mt-2">
                    <Textarea
                        value={goCode}
                        readOnly
                        className="font-mono text-sm h-64 resize-none"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={copyToClipboard}
                    >
                        复制
                    </Button>
                </div>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>关闭</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── 主页面 ─────────────────────────────────────────────────
export default function Page() {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle('JSON编辑');
        document.title = 'JSON编辑';
        return () => setTitle(null);
    }, [setTitle]);

    const editorRef = useRef(null);
    const [showGo, setShowGo] = useState(false);
    const [goCode, setGoCode] = useState('');
    const fileInputRef = useRef(null);

    // 窗口大小响应
    const [editorHeight, setEditorHeight] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerHeight - 160;
        }
        return 500;
    });

    useEffect(() => {
        const onResize = () => setEditorHeight(window.innerHeight - 160);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── 功能按钮 ──────────────────────────────────────────

    // 加载 JSON 文件
    const loadJSON = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                editorRef.current?.setText(text);
                toast.success('文件加载成功');
            } catch (err) {
                toast.error('文件格式错误');
            }
        };
        reader.readAsText(file);
        // 重置 input，允许重复加载同一文件
        e.target.value = '';
    };

    // 保存 JSON 文件
    const saveJSON = () => {
        try {
            const json = editorRef.current?.get();
            if (!json) {
                toast.error('没有可保存的内容');
                return;
            }
            const text = JSON.stringify(json, null, 2);
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.json`;
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('保存成功');
        } catch (err) {
            toast.error('保存失败: ' + err.message);
        }
    };

    // 转 Go 结构体
    const toGoStruct = () => {
        try {
            const json = editorRef.current?.get();
            if (!json) {
                toast.error('没有可转换的内容');
                return;
            }
            const result = jsonToGo(JSON.stringify(json), null, false, false);
            if (result.error) {
                toast.error('转换失败: ' + result.error);
                return;
            }
            setGoCode(result.go);
            setShowGo(true);
        } catch (err) {
            toast.error('转换失败: ' + err.message);
        }
    };

    // Encode — 将对象序列化为 JSON 字符串
    const encode = () => {
        try {
            const json = editorRef.current?.get();
            if (!json) {
                toast.error('没有可编码的内容');
                return;
            }
            editorRef.current?.set(JSON.stringify(json));
        } catch (err) {
            toast.error('编码失败: ' + err.message);
        }
    };

    // Decode — 双重解析（处理被转义的 JSON 字符串）
    const decode = () => {
        try {
            const text = editorRef.current?.getText();
            const data = JSON.parse(JSON.parse(text));
            editorRef.current?.set(data);
        } catch (err) {
            toast.error('解码失败: ' + err.message);
        }
    };

    // 展开 — 递归解析嵌套的 JSON 字符串
    const expand = () => {
        try {
            const text = editorRef.current?.getText();
            const parsed = JSON.parse(text);
            const data = superDecode(parsed);
            editorRef.current?.set(data);
        } catch (err) {
            toast.error('展开失败: ' + err.message);
        }
    };

    const onValidate = useCallback((value) => {
        setLocalJSON(value);
    }, []);

    return (
        <>
            {/* 隐藏的文件选择器 */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* JSON 编辑器 */}
            <JSONEditorX
                ref={editorRef}
                height={`${editorHeight}px`}
                json={getLocalJSON()}
                onValidate={onValidate}
            />

            {/* 按钮栏 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2 mb-[-8px]">
                <Button size="sm" onClick={loadJSON} variant="outline">导入</Button>
                <Button size="sm" onClick={saveJSON} variant="outline">导出</Button>
                <Button size="sm" onClick={toGoStruct} variant="outline">转Go结构体</Button>
                <Button size="sm" onClick={encode} variant="outline">Stringify</Button>
                <Button size="sm" onClick={decode} variant="outline">Parse</Button>
                <Button size="sm" onClick={expand} variant="outline">ParseAll</Button>
            </div>

            {/* Go 结构体弹窗 */}
            <GoStructModal
                open={showGo}
                onClose={() => setShowGo(false)}
                goCode={goCode}
            />
        </>
    );
}
