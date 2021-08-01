function merge(baseAttr, value) {
    let frameAttrs = {}
    Object.keys(baseAttr).forEach(item => {
        frameAttrs[item] = baseAttr[item]
    })
    Object.keys(value).forEach(item => {
        frameAttrs[item] = value[item]
    })
    return frameAttrs
}

export default merge