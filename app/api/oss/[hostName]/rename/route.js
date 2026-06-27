import { NextResponse } from 'next/server';
import { getS3Client, rename } from '../../../../../lib/oss';

// 重命名：POST JSON { bucket, from, to }（S3 用 copy + delete 实现）
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ctx = getS3Client(hostName);
    if (!ctx) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { bucket, from, to } = await request.json();
        if (!bucket) {
            return NextResponse.json({ error: '缺少 bucket' }, { status: 400 });
        }
        if (!from || !to) {
            return NextResponse.json({ error: '缺少 from 或 to' }, { status: 400 });
        }
        await rename(ctx, bucket, from, to);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
