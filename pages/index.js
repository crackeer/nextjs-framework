import React from 'react';
import { Card, Button, Row, Input, Radio, Col, Modal, Form, message, Space } from 'antd';

import { getEnv } from '../lib/env';
class Home extends React.Component {
    form = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            isOnline: false,
            host: "",
            
            loginUrl: '',
            token: '',
            currentEnv: '',
            leftSlideTheme: '',
            shepherdEnv: '',
            showSetMail: false,

            displayModal: false
        }
    }
    componentDidMount = async () => {
        await this.setState({
            host: location.host,
            currentEnv: getEnv(),
            leftSlideTheme: localStorage.getItem("left-slide-theme") || 'dark',
            shepherdEnv: localStorage.getItem("shepherd-env") || '',
        })
    }
    logout = async () => {
        let result = await APIOpen.getLogoutURL()
        if (result.code == 0) {
            window.location.href = result.data.logout_url
        }

    }
    htmlTitle = () => {
        return "首页"
    }
    render() {
        const { showLogin } = this.state
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