import { NextResponse } from 'next/server';
import { getFtpConfig, remove } from '../../../../../lib/ftp';

// 删除文件或目录：POST JSON { path, isDir }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ftpConfig = getFtpConfig(hostName);
    if (!ftpConfig) {
        return NextResponse.json({ error: `未知的 FTP 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path, isDir } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        await remove(ftpConfig, path, !!isDir);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
