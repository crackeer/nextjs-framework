import ReactDOM from 'react-dom';
import React from 'react';
import JSONView from './JSONView'
import { Modal, } from 'antd';

function showJSON(title, data) {
    let dom = ReactDOM.render(
        <ModelJSON data={data} title={title} show={true}/>,
        document.getElementById('json-id')
    )
    dom.show()
}

function hideJSON(title, data) {
    ReactDOM.render(
        <></>,
        document.getElementById('json-id')
    )
}

export  {
    showJSON, hideJSON,
}

class ModelJSON extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
           show: true,
        }
    }
    show = async () => {
        this.setState({
            show : true
        })
    }
    render() {
       return <Modal title={this.props.title} visible={this.state.show} okText="确认" onOk={() => {
            this.setState({
                show: false
            })
        }} onCancel={() => {
            this.setState({
                show: false
            })
        }} width="60%" bodyStyle={{ padding: '1px 10px' }}>
            <JSONView str={this.props.data} />
        </Modal>
    }
}
