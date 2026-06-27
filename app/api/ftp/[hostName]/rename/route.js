import { NextResponse } from 'next/server';
import { getFtpConfig, rename } from '../../../../../lib/ftp';

// 重命名：POST JSON { from, to }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ftpConfig = getFtpConfig(hostName);
    if (!ftpConfig) {
        return NextResponse.json({ error: `未知的 FTP 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { from, to } = await request.json();
        if (!from || !to) {
            return NextResponse.json({ error: '缺少 from 或 to' }, { status: 400 });
        }
        await rename(ftpConfig, from, to);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
