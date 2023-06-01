import { Table } from 'antd';
import JSONView from './JSONView'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
export default function renderTable(props) {
    let columns = []
    for (var i in props.columnKeys) {
        columns.push({
            title: props.columnKeys[i],
            dataIndex: props.columnKeys[i],
            key: props.columnKeys[i],
        })
    }
    return <>
        <Table columns={columns} dataSource={props.dataSource} pagination={false} size="small" scroll={props.scroll} expandable={{
            expandedRowRender: record => <p style={{ margin: 0, width: '100%' }}>
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