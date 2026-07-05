import { NextResponse } from 'next/server';
import { getSshConfig, mkdir } from '../../../../../lib/ssh-file';

// 创建目录：POST JSON { path }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const sshConfig = getSshConfig(hostName);
    if (!sshConfig) {
        return NextResponse.json({ error: `未知的 SSH 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        await mkdir(sshConfig, path);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
