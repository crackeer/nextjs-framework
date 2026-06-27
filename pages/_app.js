import '../styles/globals.css'
import { Divider, FloatButton, Layout, Menu } from 'antd';
import React from 'react';
import Head from 'next/head'
import { getCurrentEnv } from '../lib/util';
import getMenu from "./menu"

const { Header, Sider } = Layout;

// 根据当前路径反查所属的顶部一级菜单 key
function getTopKeyByPath(menus, path) {
    for (let item of menus) {
        if (item.hide) continue
        if (item.submenu) {
            if (item.submenu.some(sub => !sub.hide && sub.key === path)) return item.key
        } else if (item.key === path) {
            return item.key
        }
    }
    return ''
}

class ClassApp extends React.Component {
    component = null
    headerRef = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            inited: false,
            title: <></>,
            headTitle: '',
            collapsed: false,
            selectedKeys: [],
            topSelectedKey: '',
            allMenus: [],
        }
    }
    componentDidMount = async () => {
        let collapsed = localStorage.getItem('collapsed') > 0
        let env = getCurrentEnv()
        let menus = getMenu(env)
        let path = window.location.pathname
        await this.setState({
            inited: true,
            selectedKeys: [path],
            topSelectedKey: getTopKeyByPath(menus, path),
            allMenus: menus,
            collapsed: collapsed,
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
        await this.setState({ collapsed: value })
        localStorage.setItem('collapsed', value ? '1' : '0')
    }
    onTopMenuClick = ({ key }) => {
        // 点击带子菜单的顶部项时仅切换左侧子导航，不跳转（这类项没有 href）
        const item = this.state.allMenus.find(m => m.key === key)
        if (item && item.submenu) {
            this.setState({ topSelectedKey: key })
        }
    }
    render() {
        const { Component, pageProps } = this.props
        if (!this.state.inited) {
            return null
        }
        const { allMenus, topSelectedKey, selectedKeys, collapsed } = this.state
        const topMenus = allMenus.filter(item => !item.hide)
        const activeTop = topMenus.find(item => item.key === topSelectedKey)
        const subMenus = activeTop && activeTop.submenu ? activeTop.submenu.filter(s => !s.hide) : []
        const showSider = subMenus.length > 0

        return <>
            <Head>
                <title>{this.state.headTitle || 'admin后台'}</title>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width,initial-scale=0,maximum-scale=0,user-scalable=yes,shrink-to-fit=yes" />
            </Head>
            <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginRight: 32, whiteSpace: 'nowrap' }}>Admin后台</div>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        selectedKeys={[topSelectedKey]}
                        onClick={this.onTopMenuClick}
                        style={{ flex: 1, minWidth: 0, background: 'transparent' }}
                    >
                        {topMenus.map(item => (
                            <Menu.Item key={item.key}>
                                {item.submenu ? item.title : <a href={item.href}>{item.title}</a>}
                            </Menu.Item>
                        ))}
                    </Menu>
                </Header>
                <Layout hasSider>
                    {showSider && (
                        <Sider
                            collapsible
                            collapsed={collapsed}
                            onCollapse={this.setCollapse}
                            width={200}
                            theme="light"
                        >
                            <Menu
                                mode="inline"
                                theme="light"
                                selectedKeys={selectedKeys}
                                style={{ height: '100%', borderRight: 0 }}
                            >
                                {subMenus.map(item => (
                                    <Menu.Item key={item.key}>
                                        <a href={item.href}>{item.title}</a>
                                    </Menu.Item>
                                ))}
                            </Menu>
                        </Sider>
                    )}
                    <Layout className="site-layout" style={{ padding: '20px 20px 50px' }}>
                        <div ref={r => this.headerRef = r}>
                            {this.state.title}
                        </div>
                        <Divider style={{ margin: '0 0 20px' }}></Divider>
                        <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                        <div id="json-id"></div>
                        <FloatButton.BackTop />
                    </Layout>
                </Layout>
            </Layout>

        </>
    }
}


export default ClassApp
