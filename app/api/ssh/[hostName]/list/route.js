import { NextResponse } from 'next/server';
import { getSshConfig, listDir, getHomeDir } from '../../../../../lib/ssh-file';

// 列目录：GET /api/ssh/[hostName]/list?path=/some/dir
// path 为 '~' 时自动解析为用户家目录
export async function GET(request, context) {
    const { hostName } = await context.params;
    const sshConfig = getSshConfig(hostName);
    if (!sshConfig) {
        return NextResponse.json({ error: `未知的 SSH 主机: ${hostName}` }, { status: 404 });
    }
    let path = request.nextUrl.searchParams.get('path') || '/';
    try {
        // 解析 ~ 为用户家目录
        if (path === '~' || path.startsWith('~/')) {
            const home = await getHomeDir(sshConfig);
            path = path === '~' ? home : home + path.slice(1);
        }
        const items = await listDir(sshConfig, path);
        return NextResponse.json({ path, items });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
