import React from 'react';
import { Tabs } from 'antd';
const { TabPane } = Tabs;
import query from '../lib/query';
import Router from 'next/router'
class IFrame extends React.Component<any, any> {
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            activeKey: '0'
        }
    }
    componentDidMount() {
        let key =  String(query('key'))
        if(key.length < 1) {
            key = '0'
        }
        this.setState({
            activeKey: key
        })
    }
    change = async (val) => {
        await this.setState({
            activeKey: val
        })
        Router.push({
            query : {
                key : val,
            }
        })

    }
    render() {
        const { activeKey } = this.state
        return (
            <div>
                <Tabs defaultActiveKey={'0'} centered activeKey={activeKey} onChange={this.change}
                >
                    {this.props.list.map((item, i) => {
                        return <TabPane tab={item._name} key={i}>
                            <iframe {...item}></iframe>
                            <p><strong>网址：</strong><a href={item.src} target="_blank">{item.src}</a></p>

                        </TabPane>
                    })}
                </Tabs>
            </div>

        );
    }
}

export default IFrame;
