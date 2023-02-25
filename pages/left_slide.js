import React from 'react';
import {  Menu } from 'antd';
import { getEnv } from '../lib/env';
import { getSlideMenu } from '../lib/menu';

const { SubMenu } = Menu;

class Slide extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedKeys: [],
            env: '',
            shepherdHost: '',
            allMenus : [],
        }
    }
    async componentDidMount() {
        let env = getEnv()
        await this.setState({ selectedKeys: [window.location.pathname], env: env, allMenus :  getSlideMenu()});
    }
    onCollapse = collapsed => {
        this.setState({ collapsed });
    };
    setSelectKey = (data) => {
        this.setState({ selectedKeys: [data] })
    }
    render() {
        return (
            <Menu selectedKeys={this.state.selectedKeys} mode="inline" defaultOpenKeys={['sub1', 'sub2', 'sub3', 'sub4']} theme="dark">
                {this.state.allMenus.map(item => {
                    if(item.hide != undefined && item.hide) {
                        return null;
                    }
                    if (item.submenu == undefined) {
                        return <Menu.Item key={item.key} icon={item.icon}>
                            <a href={item.href}>{item.title}</a>
                        </Menu.Item>
                    }
                    return <SubMenu key={item.key} icon={item.icon} title={item.title}>
                        {item.submenu.map(item2 => {
                            if(item2.hide != undefined && item2.hide) {
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
        );
    }
}

export default Slide;
