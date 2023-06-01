import '../styles/globals.css'
import 'antd/dist/antd.css';
import { Divider, BackTop, Layout,Menu } from 'antd';
import React from 'react';
import Head from 'next/head'
const { Sider } = Layout;
import { getCurrentEnv } from '../lib/util';
import getMenu from "./menu"
const { SubMenu } = Menu;

function getMarginLeft(value) {
    if (value) {
        return "80px"
    }
    return "200px"
}
class ClassApp extends React.Component {
    component = null
    headerRef = null
    openKeys = []
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            title: <></>,
            headTitle: '',
            collapsed: null,
            marginLeft: '',

            selectedKeys: [],
            env: '',
            allMenus: [],
            openKeys: [],
        }
    }
    componentDidMount = async () => {
        let collapsed = localStorage.getItem('collapsed') > 0
        let env = getCurrentEnv()
        let menus = getMenu(env)
        let openKeys = []
        menus.forEach(item => {
            openKeys.push(item.key)
        })
        this.openKeys = JSON.parse(JSON.stringify(openKeys))
        if (collapsed) {
            openKeys = []
        }
        await this.setState({
            selectedKeys: [window.location.pathname],
            env: env,
            allMenus: menus,
            openKeys: openKeys,
            collapsed: collapsed,
            marginLeft: getMarginLeft(collapsed)
        });
    }
    updateTitle = async () => {
        if (this.component != null && this.component.renderPageTitle != null && this.component.renderPageTitle != undefined) {
            await this.setState({
                title: this.component.renderPageTitle(),
            })
        }
    }
    refUpdate = async (ref) => {
        this.component = ref
        if (ref != null) {
            if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
                this.setState({
                    headTitle: ref.htmlTitle(),
                })
            }
            if (ref.renderPageTitle != null && ref.renderPageTitle != undefined) {
                await this.setState({
                    title: ref.renderPageTitle(),
                })
            } else if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
                await this.setState({
                    title: <h3>
                        <strong>{ref.htmlTitle()}</strong>
                    </h3>
                })
            }
        }
    }
    setCollapse = async (value) => {
        await this.setState({
            collapsed: value,
            marginLeft: getMarginLeft(value),
            openKeys : value ? this.state.openKeys : this.openKeys,
        })
        localStorage.setItem('collapsed', value ? '1' : '0')
    }
    render() {
        const { Component, pageProps } = this.props
        if (this.state.collapsed == null) {
            return null
        }
        return <>
            <Head>
                <title>{this.state.headTitle || 'admin后台'}</title>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width,initial-scale=0,maximum-scale=0,user-scalable=yes,shrink-to-fit=yes" />
            </Head>
            <Layout hasSider>
                <Sider
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                    }}
                    collapsible
                    collapsed={this.state.collapsed}
                    onCollapse={this.setCollapse}
                >
                    <Menu selectedKeys={this.state.selectedKeys} mode="inline" theme="dark" openKeys={this.state.openKeys} onOpenChange={(value) => { this.setState({ openKeys: value }) }} style={{paddingBottom:'50px'}}>
                        {this.state.allMenus.map(item => {
                            if (item.hide != undefined && item.hide) {
                                return null;
                            }
                            if (item.submenu == undefined) {
                                return <Menu.Item key={item.key} icon={item.icon}>
                                    <a href={item.href}>{item.title}</a>
                                </Menu.Item>
                            }
                            return <SubMenu key={item.key} icon={item.icon} title={item.title}>
                                {item.submenu.map(item2 => {
                                    if (item2.hide != undefined && item2.hide) {
                                        return null;
                                    }
                                    return <Menu.Item key={item2.key}>
                                        <a href={item2.href}>{item2.title}</a>
                                    </Menu.Item>
                                })
                                }
                            </SubMenu>
                        })}
                    </Menu>
                </Sider>
                <Layout className="site-layout" style={{ marginLeft: this.state.marginLeft, padding: '20px 20px 50px' }}>
                    <div ref={r => this.headerRef = r}>
                        {this.state.title}
                    </div>
                    <Divider style={{ margin: '0 0 20px' }}></Divider>
                    <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                    <div id="json-id"></div>
                    <BackTop duration={1000} />
                </Layout>
            </Layout>

        </>
    }
}


export default ClassApp
