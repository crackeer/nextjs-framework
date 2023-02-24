import React from 'react';
import { Collapse, Input, Card, Divider, Button, Tabs, message } from 'antd';

const { Panel } = Collapse;
const { TabPane } = Tabs;

class WsClient extends React.Component {
    webConn = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            uri: '',
            connected: false,
            messages: [],
            sendmsg : '',
        }
    }
    componentDidMount = () => {
        window.addEventListener('beforeunload', this.beforeunload);
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
    setWsUri = async (val) => {
        await this.setState({
            uri: val
        })
    }
    componentWillUnmount = () => {
        this.closeWsServer()
        window.removeEventListener('beforeunload', this.beforeunload);
    }
    connectWsServer = async () => {
        await this.closeWsServer()
        this.setState({
            connected: true
        })
        this.connectWs()
    }
    connectWs = () => {
        if (this.state.uri.trim().length < 1) {
            return
        }
        let wsUrl = this.props.wsHost + this.state.uri
        try {
            this.webConn = new WebSocket(wsUrl);
            this.webConn.onopen = this.onWsOpen
            this.webConn.onmessage = this.onWsMessage
            this.webConn.onclose = this.onWsClose
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
        message.info(this.props.title + "连接关闭了")
        this.setState({
            connected: false
        })
    }
    onWsSend = async () => {
        message.info(this.props.title + "连接关闭了")
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
                <strong>{this.props.title}</strong>
                <Input.TextArea value={this.state.uri} rows={3} onChange={(e) => { this.setState({ uri: e.target.value }) }} placeholder="URI" />
                <strong>消息list</strong>
                {this.state.messages.map((data, i) => {
                    return <div key={i}>
                        <strong>{data.title}</strong>
                        <Input.TextArea value={data.message} rows={3} />
                    </div>
                })}
                <Input.TextArea value={this.state.sendmsg} rows={3} onChange={(e) => { this.setState({ sendmsg: e.target.value }) }} placeholder="发送消息" />
                <p style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <Button style={{ marginRight: '20px' }} type="primary" onClick={this.sendMessage}>发送消息</Button>
                    <Button type="primary" onClick={this.clearMessage} style={{ marginRight: '20px' }}>清空消息</Button>
                    <Button type="primary" onClick={this.closeWsServer} style={{ marginRight: '20px', display: connected ? '' : 'none' }} danger>关闭客户端</Button>
                    <Button type="primary" onClick={this.connectWsServer} style={{ marginRight: '20px', display: connected ? 'none' : '' }}>连接客户端</Button>
                </p>
            </div >
        );
    }
}

export default WsClient;