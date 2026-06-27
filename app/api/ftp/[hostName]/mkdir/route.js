import { NextResponse } from 'next/server';
import { getFtpConfig, mkdir } from '../../../../../lib/ftp';

// 创建目录：POST JSON { path }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ftpConfig = getFtpConfig(hostName);
    if (!ftpConfig) {
        return NextResponse.json({ error: `未知的 FTP 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        await mkdir(ftpConfig, path);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
