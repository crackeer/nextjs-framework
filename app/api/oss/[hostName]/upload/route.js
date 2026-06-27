import { NextResponse } from 'next/server';
import { getS3Client, uploadFile } from '../../../../../lib/oss';

// 上传文件：multipart/form-data，字段 file + path + bucket
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ctx = getS3Client(hostName);
    if (!ctx) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const dir = formData.get('path') || '/';
        const bucket = formData.get('bucket');
        if (!file) {
            return NextResponse.json({ error: '缺少 file 字段' }, { status: 400 });
        }
        if (!bucket) {
            return NextResponse.json({ error: '缺少 bucket 字段' }, { status: 400 });
        }
        const base = dir.replace(/^\/+/, '').replace(/\/+$/, '');
        const key = base ? `${base}/${file.name}` : file.name;
        await uploadFile(ctx, bucket, key, file.stream());
        return NextResponse.json({ ok: true, path: key });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
