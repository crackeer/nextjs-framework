

function getList(key) {
    let values = localStorage.getItem(key)
    if (values == null || values == '') {
        return []
    }
    
    return values.split(',').reverse()
}

function appendList(key, val) {
    let values = localStorage.getItem(key)
    if(values == null) {
        values = ''
    }
    let list = values.split(',')
    let exist = false
    list.forEach(i => {
        if (i == val.trim()) {
            exist = true
        }
    })
    if(exist) {
        return false
    }
    list.push(val.trim())
    localStorage.setItem(key, list.join(','))
    return true
}

export default {
    getList, appendList
}