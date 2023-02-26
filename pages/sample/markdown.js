import { Card } from 'antd';


export default function() {
    return <>
        <h1>Hello World</h1>
        <Card title={"Markdown的那些"}>
            <p><a href="https://github.com/bytedance/bytemd" target="_blank">https://github.com/bytedance/bytemd</a></p>
            <p>
                <a href="https://pandao.github.io/editor.md/" target={"_blank"}>https://pandao.github.io/editor.md/</a>
            </p>
        </Card>
    </>
}