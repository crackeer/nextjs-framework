import React from 'react';

import merge from '../lib/merge'
import { Space, Card } from 'antd';
let framelist = [
    {
        src: 'http://www.51pptmoban.com/',
        _name: '51PPT模板'
    },
    {
        src: 'https://mholt.github.io/json-to-go/',
        _name: 'JSON2Struct(2)',
    }
]
function Link() {

    let list = framelist.map(value => {
        return merge({
            height: '800px',
            width: '100%',
        }, value)
    })
    return <div style={{margin:'0 auto'}}>
        <Space size={[25, 50]} wrap align="baseline">
            {
                list.map(item => {
                    return <Card style={{ textAlign: 'center'}}>
                        <a href={item.src} target="_blank" style={{fontSize:'15px', fontWeight:'bolder'}}>{item._name}</a>
                    </Card>
                })
            }
        </Space>

    </div>
}
export default Link;