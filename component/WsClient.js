import React from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

class WsClient extends React.Component {
    webConn = null;
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            uri: '',
            connected: false,
            messages: [],
            sendmsg: '',
        };
    }
    componentDidMount = () => {
        window.addEventListener('beforeunload', this.beforeunload);
    };

    closeWsServer = async () => {
        if (this.webConn != null) {
            this.webConn.close();
        }
        this.webConn = null;
        await this.setState({ connected: false });
    };
    setWsUri = async (val) => {
        await this.setState({ uri: val });
    };
    componentWillUnmount = () => {
        this.closeWsServer();
        window.removeEventListener('beforeunload', this.beforeunload);
    };
    connectWsServer = async () => {
        await this.closeWsServer();
        this.setState({ connected: true });
        this.connectWs();
    };
    connectWs = () => {
        if (this.state.uri.trim().length < 1) {
            return;
        }
        let wsUrl = this.props.wsHost + this.state.uri;
        try {
            this.webConn = new WebSocket(wsUrl);
            this.webConn.onopen = this.onWsOpen;
            this.webConn.onmessage = this.onWsMessage;
            this.webConn.onclose = this.onWsClose;
        } catch (e) {
            toast.error(String(e));
        }
    };
    onWsOpen = async () => {
        console.log(this.props.title + '连接上 ws 服务端了');
        toast.success(this.props.title + '连接上 ws 服务端了');
        this.setState({ connected: true });
    };
    onWsMessage = async (msg) => {
        let list = this.state.messages;
        list.push({
            title: '收到消息',
            message: msg.data,
        });
        this.setState({ messages: list });
    };
    sendMessage = async () => {
        this.webConn.send(this.state.sendmsg);
    };
    onWsClose = async () => {
        toast.info(this.props.title + '连接关闭了');
        this.setState({ connected: false });
    };
    onWsSend = async () => {
        toast.info(this.props.title + '连接关闭了');
        this.setState({ connected: false });
    };
    beforeunload = (e) => {
        this.closeWsServer();
    };
    clearMessage = async () => {
        this.setState({ messages: [] });
    };
    render() {
        const { connected } = this.state;
        return (
            <div className="space-y-3">
                <strong>{this.props.title}</strong>
                <Textarea
                    value={this.state.uri}
                    rows={3}
                    onChange={(e) => this.setState({ uri: e.target.value })}
                    placeholder="URI"
                />
                <strong>消息list</strong>
                <div className="space-y-3">
                    {this.state.messages.map((data, i) => (
                        <div key={i}>
                            <strong>{data.title}</strong>
                            <Textarea value={data.message} rows={3} readOnly />
                        </div>
                    ))}
                </div>
                <Textarea
                    value={this.state.sendmsg}
                    rows={3}
                    onChange={(e) => this.setState({ sendmsg: e.target.value })}
                    placeholder="发送消息"
                />
                <div className="flex flex-wrap gap-2">
                    <Button onClick={this.sendMessage}>发送消息</Button>
                    <Button onClick={this.clearMessage}>清空消息</Button>
                    {connected && (
                        <Button variant="destructive" onClick={this.closeWsServer}>
                            关闭客户端
                        </Button>
                    )}
                    {!connected && <Button onClick={this.connectWsServer}>连接客户端</Button>}
                </div>
            </div>
        );
    }
}

export default WsClient;
