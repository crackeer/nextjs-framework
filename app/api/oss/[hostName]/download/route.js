import { NextResponse } from 'next/server';
import { getS3Client, downloadFile } from '../../../../../lib/oss';

// 下载文件：GET /api/oss/[hostName]/download?bucket=xxx&path=/foo/bar.txt
export async function GET(request, context) {
    const { hostName } = await context.params;
    const ctx = getS3Client(hostName);
    if (!ctx) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    const bucket = request.nextUrl.searchParams.get('bucket');
    if (!bucket) {
        return NextResponse.json({ error: '缺少 bucket 参数' }, { status: 400 });
    }
    const path = request.nextUrl.searchParams.get('path');
    if (!path) {
        return NextResponse.json({ error: '缺少 path 参数' }, { status: 400 });
    }
    try {
        const { buffer, name } = await downloadFile(ctx, bucket, path);
        const encodedName = encodeURIComponent(name);
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
                'Content-Length': String(buffer.length),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
