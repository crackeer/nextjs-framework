'use client';
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { usePageTitle } from '../../components/DashboardShell';

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        return (
            <div className="grid grid-cols-1 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">用户信息</CardTitle>
                    </CardHeader>
                    <CardContent />
                </Card>
            </div>
        );
    }
}

export default function Page() {
    const { setTitle } = usePageTitle();
    useEffect(() => {
        setTitle('首页');
        document.title = '首页';
        return () => setTitle(null);
    }, [setTitle]);

    return (
        <>
            <Home />
        </>
    );
}
