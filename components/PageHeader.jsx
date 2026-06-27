'use client';
import { useEffect } from 'react';
import { usePageTitle } from './DashboardShell';

/**
 * 页面头部组件：在内容区顶部渲染标题，并同步浏览器标签页标题。
 * 用法：
 *   <PageHeader title="首页"><Home /></PageHeader>
 */
export default function PageHeader({ title, children }) {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle(
            <h3 className="text-lg font-semibold">
                <strong>{title}</strong>
            </h3>
        );
        return () => setTitle(null);
    }, [title, setTitle]);

    return (
        <>
            <title>{title} - admin后台</title>
            {children}
        </>
    );
}
