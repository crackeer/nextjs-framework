'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Server } from 'lucide-react';

export default function K3sNavDropdown() {
    const [open, setOpen] = useState(false);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const ref = useRef(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/k3s/clusters')
            .then((r) => r.json())
            .then((data) => {
                setClusters(data.clusters || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const onClusterClick = (name) => {
        router.push(`/k3s?cluster=${encodeURIComponent(name)}`);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
                <Server className="h-4 w-4" />
                <span>K3s</span>
                <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] bg-white border border-gray-200 rounded-md shadow-lg py-1">
                    {loading ? (
                        <div className="px-3 py-2 text-sm text-gray-400">加载中…</div>
                    ) : clusters.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                            未配置 K3S 集群
                            <div className="text-xs mt-1 text-gray-500">
                                请在 config/app.config.js 的 k3s 字段添加
                            </div>
                        </div>
                    ) : (
                        clusters.map((cluster) => (
                            <button
                                key={cluster.name}
                                onClick={() => onClusterClick(cluster.name)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                            >
                                <Server className="h-4 w-4 text-gray-500" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-800">{cluster.name}</div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {cluster.kubeConfig}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}