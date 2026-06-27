import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';

// 返回 OSS 主机列表（不包含密钥）
export async function GET() {
    const config = loadConfig();
    const hosts = (config.oss || []).map((o) => ({
        name: o.name,
        region: o.region,
        bucket: o.bucket,
    }));
    return NextResponse.json({ hosts });
}
