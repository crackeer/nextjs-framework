import {getEnv} from '../lib/env'
import {apiHostMap} from '../lib/const'
import Cookies from 'js-cookie'
const host = function () {
    let realHost = localStorage.getItem('host')
    if (realHost != null && realHost.length > 0) {
        return realHost
    }

    let env = getEnv()

    if(apiHostMap[env] != undefined) {
        return apiHostMap[env]
    }
    return "/_proxy_"
}


const always_header = (header) => {
    return header
}

export  {
    host, always_header
}