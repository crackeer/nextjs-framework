import '../styles/globals.css'
import 'antd/dist/antd.css';
import { Divider, Row, Col } from 'antd';
import LeftSlide from './left_slide';
import React from 'react';
import Head from 'next/head'
import { Layout, Menu, theme } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
class ClassApp extends React.Component {
    component = null
    slider = null
    headerRef = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            title: null,
            hasTitle: false,
            headTitle: '',
        }
    }
    updateTitle = async () => {
        if (this.component != null && this.component.renderPageTitle != null && this.component.renderPageTitle != undefined) {
            await this.setState({
                title: this.component.renderPageTitle(),
                hasTitle: true,
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
                    hasTitle: true,
                })
            } else if (ref.htmlTitle != null && ref.htmlTitle != undefined) {
                await this.setState({
                    title: <h3>
                        <strong>{ref.htmlTitle()}</strong>
                    </h3>,
                    hasTitle: true,
                })
            }
        }
    }
    render() {
        const { Component, pageProps, hasTitle } = this.props
        return <>
            <Head>
                <title>{this.state.headTitle || 'NextJs Framework'}</title>
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
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
                >
                    <LeftSlide ref={(ele) => { this.slider = ele }} />
                </Sider>
                <Layout className="site-layout" style={{ marginLeft: 220 }}>
                    <Content  style={{ padding: '20px 20px 100px 0' }}>
                        {
                            this.state.hasTitle ? <>
                                <div>
                                    {this.state.title}
                                </div>
                                <Divider style={{ margin: '0 0 20px' }}></Divider>
                            </> : null
                        }
                        <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                        <div id="json-id"></div>
                    </Content>
                </Layout>
            </Layout>
        </>
    }
}


export default ClassApp
