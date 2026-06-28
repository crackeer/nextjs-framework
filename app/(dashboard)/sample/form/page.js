'use client';
import { useEffect } from 'react';
import { usePageTitle } from '../../../../components/DashboardShell';

export default function Page() {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle('表单示例');
        document.title = '表单示例';
        return () => setTitle(null);
    }, [setTitle]);

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Hello World</h1>
                <p className="text-muted-foreground">This is my first post.</p>
            </div>
        </>
    );
}
