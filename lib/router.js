function getRealPath(path) {
    return path;
}

function jumpTo(path, query) {
    if(query == null) {
        window.location.href = getRealPath(path)
        return
    }
    let params = new URLSearchParams("")
    let keys = Object.keys(query)
    for(var i in keys) {
        params.append(keys[i], query[keys[i]])
    }
    let newURL = getRealPath(path) + "?" + params.toString()
    window.location.href = newURL
}

function addQuery(query) {
    let params = new URLSearchParams("")
    let keys = Object.keys(query)
    for(var i in keys) {
        params.append(keys[i], query[keys[i]])
    }
    let newURL = window.location.pathname + "?" + params.toString()
    window.history.replaceState(null, "", newURL)
}

export {
    jumpTo, getRealPath, addQuery
}
