import { NextResponse } from 'next/server';
import { getS3Client, removeFile, removeDir } from '../../../../../lib/oss';

// 删除文件或目录：POST JSON { path, isDir }
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ctx = getS3Client(hostName);
    if (!ctx) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { path, isDir } = await request.json();
        if (!path) {
            return NextResponse.json({ error: '缺少 path' }, { status: 400 });
        }
        if (isDir) {
            await removeDir(ctx, path);
        } else {
            await removeFile(ctx, path);
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
