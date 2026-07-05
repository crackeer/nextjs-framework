import { NextResponse } from 'next/server';
import { getSshConfig, downloadFile } from '../../../../../lib/ssh-file';

// 下载文件：GET /api/ssh/[hostName]/download?path=/foo/bar.txt
export async function GET(request, context) {
    const { hostName } = await context.params;
    const sshConfig = getSshConfig(hostName);
    if (!sshConfig) {
        return NextResponse.json({ error: `未知的 SSH 主机: ${hostName}` }, { status: 404 });
    }
    const path = request.nextUrl.searchParams.get('path');
    if (!path) {
        return NextResponse.json({ error: '缺少 path 参数' }, { status: 400 });
    }
    try {
        const { stream, name, size, cleanup } = await downloadFile(sshConfig, path);
        const encodedName = encodeURIComponent(name);

        const customStream = new ReadableStream({
            async start(controller) {
                stream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                stream.on('end', () => {
                    controller.close();
                    cleanup();
                });
                stream.on('error', (err) => {
                    controller.error(err);
                    cleanup();
                });
            },
            async cancel() {
                stream.destroy();
                cleanup();
            },
        });

        return new Response(customStream, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
                'Content-Length': String(size),
                'Cache-Control': 'no-cache',
            },
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
