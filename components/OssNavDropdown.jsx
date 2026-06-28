'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Cloud } from 'lucide-react';

// 顶部导航的 Oss 下拉：列出 app.config 中配置的 OSS 主机，点击后跳转到 OSS 管理页
export default function OssNavDropdown() {
    const [open, setOpen] = useState(false);
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const ref = useRef(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/oss/hosts')
            .then((r) => r.json())
            .then((data) => {
                setHosts(data.hosts || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // 点击外部关闭
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const onHostClick = (name) => {
        router.push(`/oss?host=${encodeURIComponent(name)}`);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
                <Cloud className="h-4 w-4" />
                <span>Oss</span>
                <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] bg-white border border-gray-200 rounded-md shadow-lg py-1">
                    {loading ? (
                        <div className="px-3 py-2 text-sm text-gray-400">加载中…</div>
                    ) : hosts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                            未配置 OSS 主机
                            <div className="text-xs mt-1 text-gray-500">
                                请在 config/app.config.js 的 oss 字段添加
                            </div>
                        </div>
                    ) : (
                        hosts.map((h) => (
                            <button
                                key={h.name}
                                onClick={() => onHostClick(h.name)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                            >
                                <div className="text-sm text-gray-800">{h.name}</div>
                                <div className="text-xs text-gray-400">
                                    {h.bucket} @ {h.region}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
