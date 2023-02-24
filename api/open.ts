import { get, post } from './base'
import { host } from './const.js'



export default {
    query: (tab, query) => {
        return get(host() + '/admin/query/' + tab, query)
    },
}

