import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

class Home extends React.Component {
    form = null;
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {};
    }
    htmlTitle = () => {
        return '首页';
    };
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

export default Home;
