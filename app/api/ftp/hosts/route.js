import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';

// 返回 FTP 主机列表（不包含密码）
export async function GET() {
    const config = loadConfig();
    const hosts = (config.ftp || []).map((f) => ({
        name: f.name,
        host: f.host,
        port: f.port || 21,
        user: f.user || 'anonymous',
        secure: f.secure || false,
    }));
    return NextResponse.json({ hosts });
}
