// FTP 操作封装：基于 basic-ftp，每次操作建立一次性连接，避免长连接状态管理
import ftp from 'basic-ftp';
import { Readable, PassThrough } from 'stream';
import { loadConfig } from './config.js';

// 根据名称查找 FTP 配置
export function getFtpConfig(name) {
    const config = loadConfig();
    const ftpConfig = (config.ftp || []).find((f) => f.name === name);
    if (!ftpConfig) return null;
    return {
        host: ftpConfig.host,
        port: ftpConfig.port || 21,
        user: ftpConfig.user || 'anonymous',
        password: ftpConfig.password || '',
        secure: ftpConfig.secure || false,
    };
}

const accessOpts = (c) => ({
    host: c.host,
    port: c.port,
    user: c.user,
    password: c.password,
    secure: c.secure,
    secureOptions: c.secure ? { rejectUnauthorized: false } : undefined,
});

// 建立一次性 FTP 连接并执行回调后关闭
async function withClient(ftpConfig, fn) {
    const client = new ftp.Client(30000);
    client.ftp.verbose = false;
    try {
        await client.access(accessOpts(ftpConfig));
        return await fn(client);
    } finally {
        client.close();
    }
}

// 列目录：返回 { name, isDirectory, size, modifiedAt }[]
export async function listDir(ftpConfig, remotePath) {
    return withClient(ftpConfig, async (client) => {
        const target = remotePath === '/' ? '' : remotePath;
        const items = await client.list(target);
        return items.map((it) => ({
            name: it.name,
            isDirectory: it.isDirectory,
            size: it.size,
            modifiedAt: it.modifiedAt ? it.modifiedAt.toISOString() : null,
            permissions: it.rawPermissions || '',
        }));
    });
}

// 下载文件：将整个文件读到 Buffer 后返回（小文件场景够用）
export async function downloadFile(ftpConfig, remotePath) {
    const client = new ftp.Client(30000);
    client.ftp.verbose = false;
    await client.access(accessOpts(ftpConfig));
    // 用 PassThrough 收集数据，再 concat
    const chunks = [];
    const sink = new PassThrough();
    sink.on('data', (c) => chunks.push(c));
    const size = await client.downloadTo(sink, remotePath);
    client.close();
    const buffer = Buffer.concat(chunks);
    const name = remotePath.split('/').filter(Boolean).pop() || 'download';
    return { buffer, size: typeof size === 'number' ? size : buffer.length, name };
}

// 上传文件：从 Web ReadableStream 上传到 remotePath
export async function uploadFile(ftpConfig, remotePath, webStream) {
    return withClient(ftpConfig, async (client) => {
        const nodeStream = Readable.fromWeb(webStream);
        await client.uploadFrom(nodeStream, remotePath);
    });
}

// 删除文件或目录
export async function remove(ftpConfig, remotePath, isDir) {
    return withClient(ftpConfig, async (client) => {
        if (isDir) {
            await client.removeDir(remotePath);
        } else {
            await client.remove(remotePath);
        }
    });
}

// 重命名
export async function rename(ftpConfig, fromPath, toPath) {
    return withClient(ftpConfig, async (client) => {
        await client.rename(fromPath, toPath);
    });
}

// 创建目录
export async function mkdir(ftpConfig, remotePath) {
    return withClient(ftpConfig, async (client) => {
        await client.ensureDir(remotePath);
    });
}
