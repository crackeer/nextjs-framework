import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';

// 返回 SSH 主机列表（不包含密码 / 私钥等敏感字段）
export async function GET() {
    const config = loadConfig();
    const hosts = (config.ssh || []).map((s) => ({
        name: s.name,
        host: s.host,
        port: s.port || 22,
        username: s.username,
    }));
    return NextResponse.json({ hosts });
}
