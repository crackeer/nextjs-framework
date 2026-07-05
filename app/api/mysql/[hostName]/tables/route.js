import { NextResponse } from 'next/server';
import { getPool } from '../../../../../lib/mysql';

export async function GET(request, { params }) {
    const { hostName } = params;
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    const search = searchParams.get('search') || '';

    try {
        const pool = await getPool(hostName);
        const connection = await pool.getConnection();

        try {
            if (database) {
                await connection.query(`USE \`${database}\``);
            }

            let query = `
                SELECT 
                    TABLE_NAME AS name,
                    TABLE_TYPE AS type,
                    ENGINE AS engine,
                    TABLE_ROWS AS rows,
                    DATA_LENGTH AS dataSize,
                    INDEX_LENGTH AS indexSize,
                    TABLE_COMMENT AS comment
                FROM INFORMATION_SCHEMA.TABLES
            `;

            const dbConfig = await connection.query('SELECT DATABASE() AS current_db');
            const currentDb = dbConfig[0][0].current_db;

            if (currentDb) {
                query += ` WHERE TABLE_SCHEMA = ?`;
            }

            if (search) {
                query += currentDb ? ' AND TABLE_NAME LIKE ?' : ' WHERE TABLE_NAME LIKE ?';
            }

            const params = [];
            if (currentDb) params.push(currentDb);
            if (search) params.push(`%${search}%`);

            const [rows] = await connection.query(query, params);

            return NextResponse.json({
                tables: rows.map((row) => ({
                    name: row.name,
                    type: row.type,
                    engine: row.engine,
                    rows: row.rows || 0,
                    dataSize: row.dataSize || 0,
                    indexSize: row.indexSize || 0,
                    comment: row.comment || '',
                })),
                database: currentDb,
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
