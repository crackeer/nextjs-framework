import { getRealPath } from "./router"
import { getEnv } from "./env"


let allMenus = [
    {
        key: "sub1",
        title: "网关",
        submenu: [
            {
                key: "/simple/list",
                title: "路由",
                href: "/simple/list"
            },
            {
                key: "/active/list",
                title: "API数据库",
                href: "/active/list"
            },
        ]
    }
]

function getSlideMenu() {
    let currentEnv = getEnv();
    let raws = JSON.stringify(allMenus)
    let menuCopy = JSON.parse(raws)

    for (var i in menuCopy) {
        if (menuCopy[i].href != undefined && menuCopy[i].key != undefined) {
            menuCopy[i].href = getRealPath(menuCopy[i].href)
            menuCopy[i].key = getRealPath(menuCopy[i].key)

            if (menuCopy[i].hide_env != undefined && menuCopy[i].hide_env.indexOf(currentEnv) > -1) {
                menuCopy[i]['hide'] = true
            }

        }
        if (menuCopy[i].submenu != undefined) {
            for (var j in menuCopy[i].submenu) {
                if (menuCopy[i].submenu[j].href != undefined && menuCopy[i].submenu[j].key != undefined) {
                    menuCopy[i].submenu[j].href = getRealPath(menuCopy[i].submenu[j].href)
                    menuCopy[i].submenu[j].key = getRealPath(menuCopy[i].submenu[j].key)
                    if (menuCopy[i].submenu[j].hide_env != undefined && menuCopy[i].submenu[j].hide_env.indexOf(currentEnv) > -1) {
                        menuCopy[i].submenu[j]['hide'] = true
                    }
                }
            }
        }
    }
    return menuCopy
}

export {
    getSlideMenu
}