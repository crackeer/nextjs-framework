import { NextResponse } from 'next/server';
import { getOssClient, uploadFile } from '../../../../../lib/oss';

// 上传文件：multipart/form-data，字段 file + path（目标目录）
export async function POST(request, context) {
    const { hostName } = await context.params;
    const client = getOssClient(hostName);
    if (!client) {
        return NextResponse.json({ error: `未知的 OSS 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const dir = formData.get('path') || '/';
        if (!file) {
            return NextResponse.json({ error: '缺少 file 字段' }, { status: 400 });
        }
        const base = dir.replace(/^\/+/, '').replace(/\/+$/, '');
        const key = base ? `${base}/${file.name}` : file.name;
        await uploadFile(client, key, file.stream());
        return NextResponse.json({ ok: true, path: key });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
