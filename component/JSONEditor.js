import React, {Component} from 'react';

import 'jsoneditor/dist/jsoneditor.css';
//import dynamic from 'next/dynamic'
//const JSONEditor = dynamic(import('jsoneditor'))
export default class JSONEditorX extends Component {
    jsoneditor  = null;
    container  = null;

    constructor(props) {
        super(props); // 用于父子组件传值
    }
    async componentDidMount () {
        const options = {
            mode: 'code',
            onValidate: this.props.onValidate,
            templates : this.props.templates,
        };
        const JSONEditor = await require('jsoneditor')
        this.jsoneditor = new JSONEditor(this.container, options);
        this.jsoneditor.set(this.props.json);
    }
    componentWillUnmount () {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
        }
    }
    setJSON = (json) => {
        if (this.jsoneditor) {
            this.jsoneditor.update(json);
        }
    }
    render() {
        return (
            <div style={{height: this.props.height}} ref={elem => this.container = elem} />
        );
    }
}
