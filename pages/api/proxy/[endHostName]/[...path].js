import { Readable } from 'stream';
import { loadConfig } from '../../../../lib/config';

// 不解析 body，原样透传（支持 JSON / 表单 / 文件等任意内容）
export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

// 这些响应头由 Node 自行处理，不能原样透传，否则会冲突
const DROP_RES_HEADERS = new Set([
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
]);

// 这些请求头也不应透传给上游
const DROP_REQ_HEADERS = new Set([
    'host',
    'connection',
    'content-length',
    'cookie',
    'auth_token',
]);

function buildUpstreamUrl(endHostName, pathSeg, query, apiProxy) {
    let target = apiProxy?.[endHostName];
    if (!target) return null;
    target = target.replace(/\/$/, '');
    const basePath = Array.isArray(pathSeg) ? pathSeg.join('/') : (pathSeg || '');
    const url = new URL(`${target}/${basePath}`);
    // 透传除 Next 路由参数外的查询参数
    Object.entries(query || {}).forEach(([k, v]) => {
        if (k === 'endHostName' || k === 'path') return;
        if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
        else url.searchParams.append(k, v);
    });
    return url;
}

async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    const { endHostName, path } = req.query;
    const config = loadConfig();

    const upstreamUrl = buildUpstreamUrl(endHostName, path, req.query, config.apiProxy);
    if (!upstreamUrl) {
        return res
            .status(404)
            .json({ error: `未知的 EndHost: ${endHostName}`, available: Object.keys(config.apiProxy || {}) });
    }

    // 构造转发请求头
    const headers = {};
    Object.entries(req.headers || {}).forEach(([k, v]) => {
        if (DROP_REQ_HEADERS.has(k.toLowerCase())) return;
        headers[k] = v;
    });

    const init = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
        init.body = await readBody(req);
    }

    let upstream;
    try {
        upstream = await fetch(upstreamUrl, init);
    } catch (err) {
        return res.status(502).json({
            error: '代理请求失败',
            message: err.message,
            upstream: upstreamUrl.toString(),
        });
    }

    // 透传响应状态与安全响应头
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
        if (DROP_RES_HEADERS.has(k.toLowerCase())) return;
        res.setHeader(k, v);
    });

    // 流式回写响应体
    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.pipe(res);
}
