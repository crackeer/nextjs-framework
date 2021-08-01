import React from 'react';
import { Collapse, Input, Button, Divider, Radio, Tabs, message } from 'antd';
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
    clients: any = {};
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            wsHost: "ws://172.25.191.9:9200",
            connected: false,

            wsHostList: [],
            clients: ['客户端1', '客户端2'],
            uri: "/wslog"

        }
    }

    connectAllWsServer = async () => {
        let clients = Object.keys(this.clients)
        clients.forEach(item => {
            let cli = this.clients[item]
            cli.setWsUri(this.state.uri)
        })
        clients.forEach(item => {
            let cli = this.clients[item]
            cli.connectWsServer()
        })
    }
    closeAllWsServer = () => {
        let clients = Object.keys(this.clients)
        clients.forEach(item => {
            let cli = this.clients[item]
            cli.closeWsServer()
        })
    }
    clearAllMessage = () => {
        let clients = Object.keys(this.clients)
        clients.forEach(item => {
            let cli = this.clients[item]
            cli.clearMessage()
        })
    }
    render() {
        const { connected } = this.state
        return (
            <div>
                <Row>
                    <Col span={24}><strong>WS-Host: </strong><Input value={this.state.wsHost} onChange={(e) => { this.setState({ wsHost: e.target.value }) }} placeholder="自定义Host" style={{ width: '40%' }} /></Col>
                </Row>
                <strong>快速选择Host：</strong>
                <Row style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <Col span={24}>
                        <Radio.Group defaultValue={this.state.wsHost} onChange={(val) => { this.setState({ wsHost: val.target.value }) }} style={{ width: '100%' }} size="large" >
                            {this.state.wsHostList.map(item => {
                                return <div style={{ width: '25%', display: 'inline-block' }}><Radio value={item.value}>
                                    {item.label}
                                </Radio></div>
                            })}
                        </Radio.Group>
                    </Col>
                </Row>
                <strong>连接URL：</strong>
                <Row style={{ marginTop: '10px' }}>
                    <Input.TextArea value={this.state.uri} rows={3} onChange={(e) => { this.setState({ uri: e.target.value }) }} placeholder="URI" />
                </Row>


                <Row style={{ marginTop: '20px' }}>
                    <p>
                        <Button onClick={this.connectAllWsServer} type="primary" style={{ display: connected ? 'none' : '', marginRight: '20px' }} >同时连接</Button>
                        <Button onClick={this.closeAllWsServer} type="primary" style={{ display: connected ? 'none' : '', marginRight: '20px' }} danger>同时断开</Button>
                        <Button onClick={this.closeAllWsServer} type="primary" danger style={{ display: connected ? '' : 'none', marginRight: '20px' }}>全部断开</Button>
                        <Button onClick={this.clearAllMessage} type="primary" danger>清空所有消息</Button>

                    </p>
                </Row>
                <Row>
                    {this.state.clients.map(item => {
                        return <Col span={12}>
                            <Card>
                                <WsaClient title={item} wsHost={this.state.wsHost} ref={(e) => {
                                    this.clients[item] = e
                                }} />
                            </Card>
                        </Col>
                    })}
                </Row>

            </div >
        );
    }
}

export default Websocket;