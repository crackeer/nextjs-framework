// 阿里云 OSS 操作封装：基于 ali-oss
// OSS 没有真正的目录，用 key 的前缀 + delimiter '/' 模拟目录结构
import OSS from 'ali-oss';
import { loadConfig } from './config.js';

// 根据名称查找 OSS 配置并创建客户端
export function getOssClient(name) {
    const config = loadConfig();
    const ossConfig = (config.oss || []).find((o) => o.name === name);
    if (!ossConfig) return null;
    return new OSS({
        region: ossConfig.region,
        bucket: ossConfig.bucket,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        secure: true,
    });
}

// 规范化前缀：返回不带前导 / 的形式，结尾加 /（根目录返回空串）
function normalizePrefix(prefix) {
    if (!prefix || prefix === '/') return '';
    let p = prefix.replace(/^\/+/, '');
    if (p && !p.endsWith('/')) p += '/';
    return p;
}

// 列目录：用 delimiter '/' 模拟目录结构
// 返回 { prefix, items: [{ name, isDirectory, size, url, lastModified }] }
export async function listDir(client, prefix) {
    const p = normalizePrefix(prefix);
    const result = await client.list({
        prefix: p,
        delimiter: '/',
        'max-keys': 1000,
    }, {});
    const items = [];
    // 子目录（CommonPrefixes）
    const dirs = result.prefixes || [];
    for (const d of dirs) {
        // d 形如 'foo/bar/'，去掉末尾 / 和前缀得到目录名
        const name = d.replace(/\/$/, '').split('/').pop();
        if (name) items.push({ name, isDirectory: true, size: 0, lastModified: null });
    }
    // 文件（Contents）：跳过表示当前目录的占位对象（key === p，且 size === 0）
    const files = result.objects || [];
    for (const f of files) {
        if (p && f.name === p) continue; // 占位对象
        const name = f.name.split('/').pop();
        if (!name) continue;
        items.push({
            name,
            isDirectory: false,
            size: f.size,
            lastModified: f.lastModified || (f.lastModified instanceof Date ? f.lastModified.toISOString() : null),
        });
    }
    // 目录排前，再按名排序
    items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    return { prefix: p, items };
}

// 下载文件：返回 Buffer
export async function downloadFile(client, key) {
    const normalizedKey = key.replace(/^\/+/, '');
    const result = await client.get(normalizedKey);
    return { buffer: result.content, name: normalizedKey.split('/').pop() };
}

// 上传文件：从 Web ReadableStream 上传
export async function uploadFile(client, key, webStream) {
    const normalizedKey = key.replace(/^\/+/, '');
    // 转成 Buffer 再上传（ali-oss 的 put 支持 Buffer/Stream）
    const reader = webStream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
    }
    const buffer = Buffer.concat(chunks, total);
    await client.put(normalizedKey, buffer);
    return normalizedKey;
}

// 删除文件（单个对象）
export async function removeFile(client, key) {
    const normalizedKey = key.replace(/^\/+/, '');
    await client.delete(normalizedKey);
}

// 删除目录：递归删除前缀下所有对象
export async function removeDir(client, prefix) {
    const p = normalizePrefix(prefix);
    // 列出所有对象后批量删除
    let marker = '';
    do {
        const result = await client.list({ prefix: p, 'max-keys': 1000 }, { marker });
        const objects = result.objects || [];
        if (objects.length > 0) {
            const keys = objects.map((o) => o.name);
            await client.deleteMulti(keys);
        }
        marker = result.nextMarker || '';
    } while (marker);
}

// 重命名：OSS 无直接重命名，用 copy + delete 实现
export async function rename(client, fromKey, toKey) {
    const from = fromKey.replace(/^\/+/, '');
    const to = toKey.replace(/^\/+/, '');
    await client.copy(to, from);
    await client.delete(from);
}
