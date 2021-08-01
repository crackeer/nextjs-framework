import React from 'react';
import { Button, Input, Row, Col, Space } from 'antd';
import { Base64 } from 'js-base64';
import dayjs from 'dayjs'

class Convert extends React.Component<any, any> {
    chart: any
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            output: ''
        }
    }
    base64Decode = async () => {

        let value = Base64.decode(this.state.input)
        this.setState({
            output: value
        })
    }
    base64Eecode = async () => {
        let value = Base64.encode(this.state.input)
        this.setState({
            output: value
        })
    }
    urlencode = async () => {
        let value = encodeURIComponent(this.state.input)
        this.setState({
            output: value
        })
    }
    urldecode = async () => {
        let value = decodeURIComponent(this.state.input)
        this.setState({
            output: value
        })
    }
    formatTimestamp = async () => {
        let value = dayjs(this.state.input * 1000).format('YYYY-MM-DD HH:mm:ss')
        this.setState({
            output: value
        })
    }
    nowTimestamp = async () => {
        let value = dayjs().unix()
        this.setState({
            output: value
        })
    }
    QRCode = async () => {
        let value = dayjs().unix()
        this.setState({
            output: value
        })
    }
    render() {
        return (
            <div>
                <Row>
                    <Col span={24}>
                        <Input.TextArea rows={4} onChange={(e) => {
                            this.setState({
                                input: e.target.value
                            })
                        }}></Input.TextArea>
                    </Col>
                </Row>

                <Space align="center" style={{ marginTop: '20px' }}>
                    <Button onClick={this.urldecode} type="primary">UrlDecode</Button>
                    <Button onClick={this.urlencode} type="primary">UrlEecode</Button>
                    <Button onClick={this.base64Decode} type="primary">Base64Decode</Button>
                    <Button onClick={this.base64Eecode} type="primary">Base64Eecode</Button>
                    <Button onClick={this.formatTimestamp} type="primary">时间戳格式化</Button>
                    <Button onClick={this.nowTimestamp} type="primary">获取当前时间戳</Button>
                </Space>

                <Row style={{ marginTop: '20px' }}>
                    <Col span={24}>
                        <Input.TextArea rows={4} value={this.state.output} />
                    </Col>
                </Row>
            </div>

        );
    }
}

export default Convert;
