import { NextResponse } from 'next/server';
import { getOssClient, rename } from '../../../../../lib/oss';

// 重命名：POST JSON { from, to }（OSS 用 copy + delete 实现）
export async function POST(request, context) {
    const { hostName } = await context.params;
    const client = getOssClient(hostName);
    if (!client) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const { from, to } = await request.json();
        if (!from || !to) {
            return NextResponse.json({ error: '缺少 from 或 to' }, { status: 400 });
        }
        await rename(client, from, to);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
