import { NextResponse } from 'next/server';
import { getOssClient, removeFile, removeDir } from '../../../../../lib/oss';

// 删除文件或目录：POST JSON { path, isDir }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const client = getOssClient(hostName);
    if (!client) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path, isDir } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        if (isDir) {
            await removeDir(client, path);
        } else {
            await removeFile(client, path);
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
