import React from 'react';
import { Space, Card } from 'antd';
let linklist = [
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
    return <div style={{margin:'0 auto', padding:'0 2%'}}>
        <Space size={[25, 50]} wrap align="baseline">
            {
                linklist.map(item => {
                    return <div style={{ textAlign: 'center'}}>
                        <a href={item.src} target="_blank" style={{fontSize:'15px', fontWeight:'bolder'}}>{item._name}</a>
                    </div>
                })
            }
        </Space>

    </div>
}
export default Link;