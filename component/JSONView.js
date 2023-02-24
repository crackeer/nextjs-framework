import dynamic from "next/dynamic";

export default function renderJSON(props) {
    let jsonObj = {}
    if (props.isArray) {
        jsonObj = []
    }
    if (props.src != undefined) {
        jsonObj = props.src
    } else {
        try {
            jsonObj = JSON.parse(props.str)
        } catch (e) {

        }
    }
    let collapsed = false
    if (props.collapsed != undefined) {
        collapsed = props.collapsed
    }
    const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

    return <ReactJson src={jsonObj} displayDataTypes={false} iconStyle={'square'} name={false} displayObjectSize={false} collapsed={collapsed}/>
}
