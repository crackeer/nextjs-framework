import { NextResponse } from 'next/server';
import { getPool } from '../../../../../lib/mysql';

export async function POST(request, { params }) {
    const { hostName } = params;

    try {
        const body = await request.json();
        const { sql } = body;

        if (!sql || !sql.trim()) {
            return NextResponse.json(
                { error: 'SQL 语句不能为空' },
                { status: 400 }
            );
        }

        const pool = await getPool(hostName);
        const connection = await pool.getConnection();

        try {
            const [results] = await connection.query(sql);

            let columnNames = [];
            let data = [];
            let affectedRows = 0;
            let insertId = null;

            if (Array.isArray(results)) {
                data = results;
                if (data.length > 0) {
                    columnNames = Object.keys(data[0]);
                }
            } else {
                affectedRows = results.affectedRows || 0;
                insertId = results.insertId || null;
            }

            return NextResponse.json({
                success: true,
                data,
                columnNames,
                affectedRows,
                insertId,
                message: affectedRows > 0 
                    ? `执行成功，影响 ${affectedRows} 行` 
                    : data.length > 0 
                        ? `查询成功，返回 ${data.length} 行` 
                        : '执行成功',
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
