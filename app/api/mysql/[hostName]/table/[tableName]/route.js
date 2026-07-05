import { NextResponse } from 'next/server';
import { getPool } from '../../../../../../lib/mysql';

export async function GET(request, { params }) {
    const { hostName, tableName } = params;

    try {
        const pool = await getPool(hostName);
        const connection = await pool.getConnection();

        try {
            const [describeResult] = await connection.query(`DESCRIBE \`${tableName}\``);
            const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);

            const [dataResult] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 1000`);

            return NextResponse.json({
                describe: describeResult.map((col) => ({
                    field: col.Field,
                    type: col.Type,
                    null: col.Null === 'YES',
                    key: col.Key,
                    default: col.Default,
                    extra: col.Extra,
                })),
                createTable: createResult[0]?.['Create Table'] || '',
                data: dataResult,
                columnNames: dataResult.length > 0 ? Object.keys(dataResult[0]) : [],
                total: dataResult.length,
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
