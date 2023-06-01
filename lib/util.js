import Cookies from 'js-cookie'
const formateTPL = 'YYYY-MM-DD HH:mm:ss'

function getCurrentEnv() {
    let tag = Cookies.get('tag') || null
    if (tag != null) {
        return tag
    }
    return "Unknown"
}
function getQuery(key, value) {
    let url = new URLSearchParams(window.location.search)
    return url.get(key) || value
}
function buildQuery(query) {
    let params = new URLSearchParams("")
    Object.keys(query).forEach(k => {
        params.append(k, query[k])
    })
    return params.toString()
}

function addQuery(query) {
    let params = new URLSearchParams("")
    let keys = Object.keys(query)
    for (var i in keys) {
        params.append(keys[i], query[keys[i]])
    }
    let newURL = window.location.pathname + "?" + params.toString()
    window.history.replaceState(null, "", newURL)
}

function containsChinese(str) {
    // 匹配中文字符的正则表达式  
    var reg = /[\u4e00-\u9fa5]/gm;
    return reg.test(str);
}

function extractChineseFields(data, prefix) {
    let retData = {}
    if (typeof data == 'object' && data.length == undefined) {
        Object.keys(data).forEach(key => {
            let tmpKey = prefix.length > 0 ? prefix + '.' + key : key
            if (typeof data[key] == 'string' && containsChinese(data[key])) {
                retData[tmpKey] = data[key]
            } else if (typeof data[key] == 'object') {
                let tmpData = extractChineseFields(data[key], tmpKey)
                Object.keys(tmpData).forEach(kk => {
                    retData[kk] = tmpData[kk]
                })
            }
        })
    }
    if (typeof data == 'object' && data.length != undefined) {
        for (var i in data) {
            let tmpKey = prefix.length > 0 ? prefix + '.' + i : key
            if (typeof data[i] == 'string' && containsChinese(data[i])) {
                retData[tmpKey] = data[i]
            } else if (typeof data[i] == 'object') {
                let tmpData = extractChineseFields(data[i], tmpKey)
                Object.keys(tmpData).forEach(kk => {
                    retData[kk] = tmpData[kk]
                })
            }
        }
    }
    return retData
}

function saveTextToLocal(name, data) {
    var urlObject = window.URL || window.webkitURL || window;
    var export_blob = new Blob([data]);
    var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    save_link.href = urlObject.createObjectURL(export_blob);
    save_link.download = name;
    save_link.click();
}

function mergeObject(baseAttr, value) {
    let frameAttrs = {}
    Object.keys(baseAttr).forEach(item => {
        frameAttrs[item] = baseAttr[item]
    })
    Object.keys(value).forEach(item => {
        frameAttrs[item] = value[item]
    })
    return frameAttrs
}

function getRealPath(path) {
    if (getCurrentEnv() == "develop") {
        return path;
    }
    if (path == '/') {
        return path + "index.html";
    }
    return path + ".html";
}

function jumpTo(path, query) {
    if (query == null) {
        window.location.href = getRealPath(path)
        return
    }
    let params = new URLSearchParams("")
    let keys = Object.keys(query)
    for (var i in keys) {
        params.append(keys[i], query[keys[i]])
    }
    let newURL = getRealPath(path) + "?" + params.toString()
    window.location.href = newURL
}


function Unix2Time(ts) {
    return dayjs.unix(ts).format(formateTPL)
}


function FormatTime(time) {
    return dayjs(time).format(formateTPL)
}

function TodayDate() {
    return dayjs().format('YYYY-MM-DD')
}

function NowTs() {
    return dayjs().unix()
}

export {
    getQuery, buildQuery, addQuery, getCurrentEnv, extractChineseFields, saveTextToLocal, mergeObject, getRealPath, jumpTo,
    FormatTime, Unix2Time, TodayDate, NowTs
}
