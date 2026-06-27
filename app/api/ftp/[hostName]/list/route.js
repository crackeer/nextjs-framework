import { NextResponse } from 'next/server';
import { getFtpConfig, listDir } from '../../../../../lib/ftp';

// 列目录：GET /api/ftp/[hostName]/list?path=/some/dir
export async function GET(request, context) {
    const { hostName } = await context.params;
    const ftpConfig = getFtpConfig(hostName);
    if (!ftpConfig) {
        return NextResponse.json({ error: `未知的 FTP 主机: ${hostName}` }, { status: 404 });
    }
    const path = request.nextUrl.searchParams.get('path') || '/';
    try {
        const items = await listDir(ftpConfig, path);
        return NextResponse.json({ path, items });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
