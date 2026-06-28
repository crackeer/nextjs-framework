'use client';
import React, { useEffect } from 'react';
import { usePageTitle } from './DashboardShell';

/**
 * 页面头部组件：在内容区顶部渲染标题，并同步浏览器标签页标题。
 * 用法：
 *   <PageHeader title="首页"><Home /></PageHeader>
 *
 * title:     导航栏显示的标题（支持 JSX，可用于面包屑）
 * browserTitle: 浏览器标签页标题（可选，默认取 title 字符串）
 */
export default function PageHeader({ title, browserTitle, children }) {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle(
            <h3 className="text-lg font-semibold">
                <strong>{title}</strong>
            </h3>
        );
        return () => setTitle(null);
    }, [title, setTitle]);

    // 浏览器标签标题：优先用 browserTitle，否则取 title（仅当为字符串时）
    const tabTitle = browserTitle || (typeof title === 'string' ? title : '');

    return (
        <>
            {tabTitle ? <title>{tabTitle} - admin后台</title> : null}
            {children}
        </>
    );
}
