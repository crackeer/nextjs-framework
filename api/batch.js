import axios from "axios"
import { host } from './const.js'


export default {
    batchGetWorkCode: async (workIDs) => {
        let requests = []
        for (var i in workIDs) {
            requests.push(axios.request({
                baseURL: host(),
                url: '/simple/cat',
                method: 'get',
                params: {
                    work_id: workIDs[i]
                }
            }))
        }
        let results = await axios.all(requests)
        let retData = {}
        for (var i in workIDs) {
            if (results[i].data.code == 0) {
                retData[workIDs[i]] = results[i].data.data.work_code
            }
        }
        return retData
    },}