import '../styles/globals.css'
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import React from 'react';
const { Content } = Layout;

let list = [
    { key: 'convert', name: '编码/解码' },
    { key: 'echart', name: '画Echart图' },
    { key: 'golang', name: 'Golang工具' },
    { key: 'developer', name: '开发者工具' },
    { key: 'link', name: '书签' },
]
function MyApp({ Component, pageProps }) {
    let current = Component.name.toLowerCase()
    return <div style={{margin : '0 auto', width:'80%'}}>
        <Layout style={{ minHeight: '100vh' }}>
            <Menu mode="horizontal" selectedKeys={current} theme="dark">
                <Menu.Item key={'index'}>
                    <a href="/">首页</a>
                </Menu.Item>
                <Menu.Item key={'convert'}>
                    <a href="/developer/convert">编码/解码</a>
                </Menu.Item>
            </Menu>
            <Content style={{paddingTop:'20px'}}>
                <Component {...pageProps} />
            </Content>
        </Layout>
    </div>
}

export default MyApp;