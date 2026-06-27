import { createRoot } from 'react-dom/client';
import React from 'react';
import JSONView from '../component/JSONView'
import { Modal, } from 'antd';

let root = null
function getRoot() {
    if (root == null) {
        root = createRoot(document.getElementById('json-id'))
    }
    return root
}
function showJSON(title, data) {
    getRoot().render(<ModelJSON data={data} title={title} show={true}/>)
}

function hideJSON(title, data) {
    if (root != null) {
        root.render(<></>)
    }
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
    async componentDidMount() {
    }
    show = async () => {
        this.setState({
            show : true
        })
    }
    render() {
        console.log(this.props.title,this.props.data)
       return <Modal title={this.props.title} open={this.state.show} okText="确认" onOk={() => {
            this.setState({
                show: false
            })
        }} onCancel={() => {
            this.setState({
                show: false
            })
        }} width="60%" styles={{ body: { padding: '1px 10px' } }}>
            <JSONView str={this.props.data} />
        </Modal>
    }
}
