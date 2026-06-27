import { NextResponse } from 'next/server';
import { getS3Client, rename } from '../../../../../lib/oss';

// 重命名：POST JSON { from, to }（S3 用 copy + delete 实现）
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ctx = getS3Client(hostName);
    if (!ctx) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { from, to } = await request.json();
        if (!from || !to) {
            return NextResponse.json({ error: '缺少 from 或 to' }, { status: 400 });
        }
        await rename(ctx, from, to);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
