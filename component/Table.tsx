import { Table } from 'antd';
import JSONView from './JSONView'
import {
    MinusOutlined,
    PlusOutlined
} from '@ant-design/icons';
export default function renderTable(props: any) {
    let columns = []
    let showKeySize = 6
    if (props.showKeySize != undefined) {
        showKeySize = props.showKeySize
    }
    if (props.list.length > 0) {
        Object.keys(props.list[0]).forEach(item => {
            if (columns.length < showKeySize) {
                columns.push({
                    title: item,
                    dataIndex: item,
                })
            }
        })
    }
    return <>
        <Table columns={columns} dataSource={props.list} pagination={false} size="small" scroll={props.scroll} expandable={{
            expandedRowRender: record => <p style={{ margin: 0, width:'100%' }}>
                <JSONView src={record} />
            </p>,
            rowExpandable: record => true,
            expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                    <MinusOutlined onClick={e => onExpand(record, e)} />
                ) : (
                        <PlusOutlined onClick={e => onExpand(record, e)} />
                    )
        }} />
    </>
}
