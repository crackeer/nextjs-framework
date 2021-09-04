import React from 'react';
import { Collapse, Input, Button, Space, Radio, Tabs, message } from 'antd';
import { Select, Card, Row, Col } from 'antd';
import RenderList from '../component/Table'
const { Panel } = Collapse;
const { TabPane } = Tabs;
import dayjs from 'dayjs';
import stringRandom from 'string-random'
import { List } from 'antd/lib/form/Form';
const { Option } = Select;
import WsaClient from '../component/WsClient';
import qs from 'query-string';
class Websocket extends React.Component<any, any> {
    webConn: any = null;
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            wsUrl: "ws://preline-i.svc.open.realsee.com/wslog",
            connected: false,
            messages: [],

        }
    }

    componentDidMount = () => {
        window.addEventListener('beforeunload', this.beforeunload);
    }
    componentWillUnmount = () => {
        this.closeWsServer()
        window.removeEventListener('beforeunload', this.beforeunload);
    }
    closeWsServer = async () => {
        if (this.webConn != null) {
            this.webConn.close()
        }

        this.webConn = null
        await this.setState({
            connected: false,
        })
    }
    connectWsServer = async () => {
        if (this.state.connected) {
            await this.closeWsServer()
        } else {
            await this.connectWs()
        }
    }
    connectWs = async () => {
        if (this.state.wsUrl.trim().length < 1) {
            return
        }
        try {
            this.webConn = new WebSocket(this.state.wsUrl);
            this.webConn.onopen = this.onWsOpen
            this.webConn.onmessage = this.onWsMessage
            this.webConn.onclose = this.onWsClose
            this.setState({
                connected: true
            })
        } catch (e) {
            message.info(e)
        }

    }
    onWsOpen = async () => {
        console.log(this.props.title + '连接上 ws 服务端了');
        message.info(this.props.title + "连接上 ws 服务端了")
        this.setState({
            connected: true
        })
    }
    onWsMessage = async (msg) => {
        let list = this.state.messages
        list.push({
            "title": "收到消息",
            "message": msg.data
        })

        this.setState({
            messages: list
        })
    }
    sendMessage = async (msg) => {
        this.webConn.send(msg)
    }
    onWsClose = async () => {
        message.info("连接关闭了")
        this.setState({
            connected: false
        })
    }
    onWsSend = async () => {
        this.setState({
            connected: false
        })
    }
    beforeunload = (e) => {
        this.closeWsServer()
    }
    clearMessage = async () => {
        this.setState({
            messages: []
        })
    }
    render() {
        const { connected } = this.state
        return (
            <div>
                <p><strong>连接URL：</strong></p>
                <Row style={{ marginTop: '10px' }}>
                    <Input.TextArea value={this.state.wsUrl} rows={4} onChange={(e) => { this.setState({ wsUrl: e.target.value }) }} placeholder="URI" />
                </Row>

                <Row style={{ marginTop: '15px' }}>
                    <Col span={24}>
                        <Space size={[20, 10]} align="baseline">
                            <Button onClick={this.connectWsServer} type="primary">{this.state.connected ? '断开' : '连接'}</Button>
                            <Button type="primary" onClick={this.clearMessage}>清空消息</Button>
                        </Space>
                    </Col>
                    <p>

                    </p>
                </Row>
                <Input.TextArea value={this.state.sendmsg} rows={3} onChange={(e) => { this.setState({ sendmsg: e.target.value }) }} placeholder="发送消息" />
                <strong>消息list</strong>
                {this.state.messages.map((data, i) => {
                    return <div key={i}>
                        <strong>{data.title}</strong>
                        <Input.TextArea value={data.message} rows={3} />
                    </div>
                })}

            </div >
        );
    }
}

export default Websocket;