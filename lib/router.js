
import Router  from 'next/router';



function jumpTo(path, query) {
    Router.push({
        pathname: '/page' + path,
        query,
    })
}

export  {
    jumpTo
}