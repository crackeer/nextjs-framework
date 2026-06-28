'use client';
import React, {Component} from 'react';

import 'jsoneditor/dist/jsoneditor.css';
import './jsoneditor-theme.css';
import JSONEditorLib from 'jsoneditor';

export default class JSONEditorX extends Component {
    jsoneditor  = null;
    container  = null;

    constructor(props) {
        super(props);
    }

    componentDidMount () {
        // 防御 React StrictMode 双重挂载 + 任何意外重复：强制清理所有残留
        if (this.container) {
            const allOld = this.container.querySelectorAll('.jsoneditor');
            allOld.forEach(el => el.remove());
        }
        if (this.jsoneditor) {
            return;
        }
        const options = {
            mode: 'code',
            onValidate: this.props.onValidate,
            templates : this.props.templates,
        };
        this.jsoneditor = new JSONEditorLib(this.container, options);
        this.jsoneditor.set(this.props.json);
    }

    componentWillUnmount () {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
            this.jsoneditor = null;
        }
        // 强制清空容器，防止 StrictMode 重挂载时残留 DOM
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    setJSON = (json) => {
        if (this.jsoneditor) {
            this.jsoneditor.update(json);
        }
    }

    getJSON = () => {
        if (this.jsoneditor) {
            return this.jsoneditor.get();
        }
    }

    // 直接设置编辑器文本（用于加载文件）
    setText = (text) => {
        if (this.jsoneditor) {
            this.jsoneditor.setText(text);
        }
    }

    // 获取编辑器原始 JSON 文本
    getText = () => {
        if (this.jsoneditor) {
            return this.jsoneditor.getText();
        }
        return '';
    }

    // 获取编辑器中的 JSON 对象
    get = () => {
        if (this.jsoneditor) {
            return this.jsoneditor.get();
        }
        return null;
    }

    // 设置编辑器中的 JSON 对象
    set = (json) => {
        if (this.jsoneditor) {
            this.jsoneditor.set(json);
        }
    }

    render() {
        return (
            <div style={{height: this.props.height}} ref={elem => this.container = elem} />
        );
    }
}
