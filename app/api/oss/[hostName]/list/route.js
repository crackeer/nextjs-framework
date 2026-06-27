import { NextResponse } from 'next/server';
import { getS3Client, listDir } from '../../../../../lib/oss';

// 列目录：GET /api/oss/[hostName]/list?bucket=xxx&path=/some/dir
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
    const path = request.nextUrl.searchParams.get('path') || '/';
    try {
        const result = await listDir(ctx, bucket, path);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
