import { NextResponse } from 'next/server';
import { getSshConfig, uploadFile } from '../../../../../lib/ssh-file';

// 上传文件：POST JSON { path, content (数组形式的字节数据) }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const sshConfig = getSshConfig(hostName);
    if (!sshConfig) {
        return NextResponse.json({ error: `未知的 SSH 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path, content } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        if (!Array.isArray(content)) {
            return NextResponse.json({ error: 'content 必须是数组' }, { status: 400 });
        }
        const buffer = Buffer.from(content);
        await uploadFile(sshConfig, path, buffer);
        return NextResponse.json({ ok: true, path });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
