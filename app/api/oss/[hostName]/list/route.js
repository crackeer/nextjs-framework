import { NextResponse } from 'next/server';
import { getOssClient, listDir } from '../../../../../lib/oss';

// 列目录：GET /api/oss/[hostName]/list?path=/some/dir
export async function GET(request, context) {
    const { hostName } = await context.params;
    const client = getOssClient(hostName);
    if (!client) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    const path = request.nextUrl.searchParams.get('path') || '/';
    try {
        const result = await listDir(client, path);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
