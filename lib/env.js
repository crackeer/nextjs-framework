import Cookies from 'js-cookie'

function getEnv() {

    let tag = Cookies.get('tag') || null
    if (tag != null) {
        return tag
    }

    return "develop"
}


export {
    getEnv
}
