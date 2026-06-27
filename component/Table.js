import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import JSONView from './JSONView';

export default function renderTable(props) {
    return <DataTable columnKeys={props.columnKeys} dataSource={props.dataSource} scroll={props.scroll} />;
}

function DataTable({ columnKeys = [], dataSource = [], scroll }) {
    const [expandedKeys, setExpandedKeys] = useState({});
    const toggle = (key) => setExpandedKeys((s) => ({ ...s, [key]: !s[key] }));

    return (
        <div className="rounded-md border overflow-x-auto" style={scroll ? { maxHeight: scroll.y } : undefined}>
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="w-10 px-2 py-2 text-left font-medium"></th>
                        {columnKeys.map((k) => (
                            <th key={k} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                                {k}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataSource.map((record, i) => {
                        const rowKey = record.key != null ? record.key : i;
                        const expanded = !!expandedKeys[rowKey];
                        return (
                            <React.Fragment key={rowKey}>
                                <tr className="border-t hover:bg-muted/40">
                                    <td className="px-2 py-2">
                                        <button
                                            onClick={() => toggle(rowKey)}
                                            className="p-0.5 rounded hover:bg-accent"
                                        >
                                            {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    {columnKeys.map((k) => (
                                        <td key={k} className="px-3 py-2 align-top whitespace-nowrap">
                                            {String(record[k] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                                {expanded && (
                                    <tr className="border-t">
                                        <td colSpan={columnKeys.length + 1} className="px-3 py-2 bg-muted/20">
                                            <JSONView src={record} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
