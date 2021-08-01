import React from 'react';

import IFrame from '../component/IFrame'
import merge from '../lib/merge'

let framelist = [
    {
        src: 'https://www.baidufe.com/fehelper/index/index.html',
        _name: 'FEHelper'
    },
    {
        src: 'https://www.json.cn/',
        _name: 'JSON解析'
    }
]
function Developer() {
    let list = framelist.map(value => {
        return merge({
            height: '700px',
            width: '100%',
        }, value)
    })
    return <IFrame list={list} />
}

export default Developer;