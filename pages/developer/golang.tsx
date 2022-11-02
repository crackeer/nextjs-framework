import React from 'react';

import IFrame from '../../component/IFrame'
import merge from '../../lib/merge'

let framelist = [
    {
        src: 'https://app.quicktype.io/',
        _name: 'JSON2Struct(1)'
    },
    {
        src: 'https://mholt.github.io/json-to-go/',
        _name: 'JSON2Struct(2)',
    },
    {
        src: 'https://www.devtool.com/sql2go.html',
        _name: 'SQL2Struct'
    }
]
function Golang() {

    let list = framelist.map(value => {
        return merge({
            height: '800px',
            width: '100%',
        }, value)
    })
    return <IFrame list={list} />
}
export default Golang;