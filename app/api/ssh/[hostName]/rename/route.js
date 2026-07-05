import { NextResponse } from 'next/server';
import { getSshConfig, rename } from '../../../../../lib/ssh-file';

// 重命名：POST JSON { from, to }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const sshConfig = getSshConfig(hostName);
    if (!sshConfig) {
        return NextResponse.json({ error: `未知的 SSH 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { from, to } = await request.json();
        if (!from || !to) {
            return NextResponse.json({ error: '缺少 from 或 to' }, { status: 400 });
        }
        await rename(sshConfig, from, to);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
