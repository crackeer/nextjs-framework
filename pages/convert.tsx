import React from 'react';
import { Button, Input, Row, Col, Space } from 'antd';
import { Base64 } from 'js-base64';
import dayjs from 'dayjs'
import QRCode from 'qrcode.react'

class Convert extends React.Component<any, any> {
    qrcode: any
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            output: '',
            displayQRCode : false,
        }
    }
    componentDidMount = async () => {
        this.qrcode = await require('qrcode')
    }
    do = async (tool) => {
        const {input} = this.state
        let output = ""
        let displayQRCode = false
        switch(tool) {
            case "base64_decode":
                output =  Base64.decode(input)
                break
            case "base64_encode":
                output =  Base64.encode(input)
                break
            case "urldecode":
                output =  encodeURIComponent(input)
                break
            case "urlencode":
                output =  decodeURIComponent(input)
                break
            case "formate_time":
                output =  dayjs(this.state.input * 1000).format('YYYY-MM-DD HH:mm:ss')
                break
            case "now_timestamp":
                output =  '' + dayjs().unix()
                break
            case "qrcode":
                displayQRCode = true
                output =  input
                break
        }
        this.setState({
            displayQRCode : displayQRCode,
            output: output
        })
    }
    render() {
        const {displayQRCode} = this.state
        return (
            <div>
                <Row>
                    <Col span={24}>
                        <Input.TextArea rows={10} onChange={(e) => {
                            this.setState({
                                input: e.target.value
                            })
                        }}></Input.TextArea>
                    </Col>
                </Row>

                <Space align="center" style={{ marginTop: '20px' }}>
                    <Button onClick={()=> {this.do("urldecode")}} type="primary">UrlDecode</Button>
                    <Button onClick={()=> {this.do("urlencode")}} type="primary">UrlEncode</Button>
                    <Button onClick={() => {
                        this.do("base64_decode")
                    }} type="primary">Base64Decode</Button>
                    <Button onClick={() => {
                        this.do("base64_encode")
                    }} type="primary">Base64Encode</Button>
                    <Button onClick={() => {this.do("formate_time")}} type="primary">时间戳格式化</Button>
                    <Button onClick={() => {this.do("now_timestamp")}} type="primary">获取当前时间戳</Button>
                    <Button onClick={() => {this.do("qrcode")}} type="primary">生成二维码</Button>
                </Space>

                <Row style={{ marginTop: '20px' }}>
                    <Col span={24}>
                        <QRCode value={this.state.output}  size={300} style={{display:displayQRCode ? '' : 'none'}}/>
                        <p style={{fontSize:'15px',display:displayQRCode ? 'none' : ''}}>{this.state.output}</p>
                    </Col>
                </Row>
            </div>

        );
    }
}

export default Convert;
