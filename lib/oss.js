// 对象存储操作封装：基于 AWS S3 SDK（@aws-sdk/client-s3）
// ------------------------------------------------------------------
// S3 协议是对象存储的事实标准，阿里云 OSS / 腾讯云 COS / MinIO / R2 等均兼容。
// 换云厂商只需改 endpoint + region + 凭证，业务代码无需改动。
//
// 配置（config.oss[*]）字段：
//   name            连接名（唯一，用于下拉选择）
//   region          区域，如 'us-east-1'；阿里云填 'oss-cn-hangzhou'
//   buckets         存储空间名列表（数组），页面可切换
//   accessKeyId     AccessKey ID
//   accessKeySecret AccessKey Secret
//   endpoint        可选，S3 兼容端点（阿里云/MinIO/腾讯云需填写）
//   forcePathStyle  可选，true 走 path-style（MinIO/部分私有云需要）
// ------------------------------------------------------------------
import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    CopyObjectCommand,
    ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { loadConfig } from './config.js';

// 根据名称查找 OSS 配置并创建 S3 客户端
// 返回 { client, buckets }，buckets 为配置的存储空间列表（未配置则空数组）
export function getS3Client(name) {
    const config = loadConfig();
    const ossConfig = (config.oss || []).find((o) => o.name === name);
    if (!ossConfig) return null;

    const clientConfig = {
        region: ossConfig.region,
        credentials: {
            accessKeyId: ossConfig.accessKeyId,
            secretAccessKey: ossConfig.accessKeySecret,
        },
    };
    if (ossConfig.endpoint) {
        clientConfig.endpoint = ossConfig.endpoint;
    }
    if (ossConfig.forcePathStyle) {
        clientConfig.forcePathStyle = true;
    }
    return {
        client: new S3Client(clientConfig),
        // buckets 支持字符串数组或单个字符串（向后兼容）
        buckets: Array.isArray(ossConfig.buckets)
            ? ossConfig.buckets
            : ossConfig.bucket
            ? [ossConfig.bucket]
            : [],
    };
}

// 列出账号下所有 bucket（用 ListBucketsCommand，需要账号有 list 权限）
export async function listBuckets({ client }) {
    const result = await client.send(new ListBucketsCommand({}));
    return (result.Buckets || []).map((b) => b.Name);
}

// 规范化前缀：返回不带前导 / 的形式，结尾加 /（根目录返回空串）
function normalizePrefix(prefix) {
    if (!prefix || prefix === '/') return '';
    let p = prefix.replace(/^\/+/, '');
    if (p && !p.endsWith('/')) p += '/';
    return p;
}

// 列目录：用 delimiter '/' 模拟目录结构
// 返回 { prefix, items: [{ name, isDirectory, size, lastModified }] }
export async function listDir({ client }, bucket, prefix) {
    const p = normalizePrefix(prefix);
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: p,
        Delimiter: '/',
    });
    const result = await client.send(command);

    const items = [];
    // 子目录（CommonPrefixes）
    const dirs = result.CommonPrefixes || [];
    for (const d of dirs) {
        const full = d.Prefix || '';
        // full 形如 'foo/bar/'，去掉末尾 / 和前缀得到目录名
        const name = full.replace(/\/$/, '').split('/').pop();
        if (name) items.push({ name, isDirectory: true, size: 0, lastModified: null });
    }
    // 文件（Contents）：跳过表示当前目录的占位对象（key === prefix）
    const files = result.Contents || [];
    for (const f of files) {
        const key = f.Key || '';
        if (p && key === p) continue; // 占位对象
        const name = key.split('/').pop();
        if (!name) continue;
        items.push({
            name,
            isDirectory: false,
            size: f.Size || 0,
            lastModified: f.LastModified ? f.LastModified.toISOString() : null,
        });
    }
    // 目录排前，再按名排序
    items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    return { prefix: p, items };
}

// 下载文件：返回 { buffer, name }
export async function downloadFile({ client }, bucket, key) {
    const normalizedKey = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({ Bucket: bucket, Key: normalizedKey });
    const result = await client.send(command);
    // result.Body 是 ReadableStream（Node）或 Web stream，转成 Buffer
    const buffer = Buffer.from(await result.Body.transformToByteArray());
    return { buffer, name: normalizedKey.split('/').pop() };
}

// 上传文件：从 Web ReadableStream 上传
export async function uploadFile({ client }, bucket, key, webStream) {
    const normalizedKey = key.replace(/^\/+/, '');
    // 转成 Buffer 再上传
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
    const command = new PutObjectCommand({ Bucket: bucket, Key: normalizedKey, Body: buffer });
    await client.send(command);
    return normalizedKey;
}

// 删除文件（单个对象）
export async function removeFile({ client }, bucket, key) {
    const normalizedKey = key.replace(/^\/+/, '');
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: normalizedKey });
    await client.send(command);
}

// 删除目录：递归删除前缀下所有对象（S3 每次最多删 1000 个）
export async function removeDir({ client }, bucket, prefix) {
    const p = normalizePrefix(prefix);
    let continuationToken;
    do {
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: p,
            ContinuationToken: continuationToken,
        });
        const listResult = await client.send(listCommand);
        const objects = listResult.Contents || [];
        if (objects.length > 0) {
            const toDelete = objects.map((o) => ({ Key: o.Key }));
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: toDelete },
            });
            await client.send(deleteCommand);
        }
        continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
    } while (continuationToken);
}

// 重命名：S3 无直接重命名，用 copy + delete 实现
export async function rename({ client }, bucket, fromKey, toKey) {
    const from = fromKey.replace(/^\/+/, '');
    const to = toKey.replace(/^\/+/, '');
    const copyCommand = new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${from}`,
        Key: to,
    });
    await client.send(copyCommand);
    const deleteCommand = new DeleteObjectCommand({ Bucket: bucket, Key: from });
    await client.send(deleteCommand);
}
