import qs from 'query-string';

export default function(key) {
    let query = qs.parse(window.location.search)
    if (query[key] == undefined) {
        return ""
    }

    return query[key]
}
 