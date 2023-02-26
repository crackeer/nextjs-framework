import React from 'react';
import { Card, Row, Col } from 'antd';

class Home extends React.Component {
    form = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
        }
    }
    htmlTitle = () => {
        return "首页"
    }
    render() {
        return (
            <>
                <Row>
                    <Col span={24}>
                        <Card title="用户信息" style={{ marginBottom: '20px', fontSize: '18px' }}>

                        </Card>
                    </Col>
                </Row>
            </>
        )
    }
}

export default Home;