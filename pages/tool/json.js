import React from 'react';
import { Button, Input, Row, Col, Space } from 'antd';
import JSONEditor from '../../component/JSONEditor';
class Convert extends React.Component {
    jsonObject = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            json: {},
        }
    }
    componentDidMount = async () => {
        await this.setState({
            json: this.getLocalJSONValue()
        })
        setTimeout(() => {
            this.jsonObject.setJSON(this.state.json)
        }, 800)
    }
    getLocalJSONValue = () => {
        try {
            let value = localStorage.getItem('json-local-value') || ''
            return JSON.parse(value)
        } catch(e) {
            return {}
        }
    }
    setLocalJSONValue = (value) => {
        let raws = JSON.stringify(value)
        localStorage.setItem('json-local-value', raws)
    }
    htmlTitle = () => {
        return 'JSON编辑'
    }
    render() {
        return (
            <div>
                <JSONEditor height={'calc(100vh - 100px)'} ref={(e) => {
                    this.jsonObject = e
                }} onValidate={(val) => this.setLocalJSONValue(val)}/>
            </div>

        );
    }
}

export default Convert;