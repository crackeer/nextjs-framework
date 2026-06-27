'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import PageHeader from '../../components/PageHeader';

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
    return (
        <PageHeader title="首页">
            <Home />
        </PageHeader>
    );
}
