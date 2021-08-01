import '../styles/globals.css'
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import React from 'react';
const { Content } = Layout;
const { SubMenu } = Menu;
let list = [
    { key: 'websocket', name: 'Websocket调试' },
    { key: 'echart', name: '画Echart图' },
    { key: 'golang', name: 'Golang工具' },
    { key: 'convert', name: '编码/解码' },
    { key: 'developer', name: '开发者工具' },
    { key: 'link', name: '书签' },
]
function MyApp({ Component, pageProps }) {
    let current = Component.name.toLowerCase()
    return <>
        <Layout style={{ minHeight: '100vh' }}>
            <Menu mode="horizontal" selectedKeys={current}>
                {list.map(item => {
                    return <Menu.Item key={item.key}><a href={'/' + item.key}>{item.name}</a></Menu.Item>
                })}
            </Menu>
            <Content style={{ margin: '20px auto', width: '90%' }}>
                <Component {...pageProps} />
            </Content>
        </Layout>
    </>
}

export default MyApp;