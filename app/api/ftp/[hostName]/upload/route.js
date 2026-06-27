import { NextResponse } from 'next/server';
import { getFtpConfig, uploadFile } from '../../../../../lib/ftp';

// 上传文件：multipart/form-data，字段 file + path（目标目录）
export async function POST(request, context) {
    const { hostName } = await context.params;
    const ftpConfig = getFtpConfig(hostName);
    if (!ftpConfig) {
        return NextResponse.json({ error: `未知的 FTP 主机: ${hostName}` }, { status: 404 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const dir = formData.get('path') || '/';
        if (!file) {
            return NextResponse.json({ error: '缺少 file 字段' }, { status: 400 });
        }
        // 组装远端完整路径
        const base = dir.endsWith('/') ? dir.slice(0, -1) : dir;
        const remotePath = `${base}/${file.name}`;
        // file.stream() 返回 Web ReadableStream
        await uploadFile(ftpConfig, remotePath, file.stream());
        return NextResponse.json({ ok: true, path: remotePath });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
