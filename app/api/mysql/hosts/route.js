import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';

export async function GET() {
    const config = loadConfig();
    const hosts = (config.mysql || []).map((m) => ({
        name: m.name,
        host: m.host,
        port: m.port || 3306,
        username: m.username,
        database: m.database || '',
    }));
    return NextResponse.json({ hosts });
}
