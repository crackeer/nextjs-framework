import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../../lib/config';

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

function buildUpstreamUrl(endHostName, pathSeg, searchParams, apiProxy) {
    let target = apiProxy?.[endHostName];
    if (!target) return null;
    target = target.replace(/\/$/, '');
    const basePath = Array.isArray(pathSeg) ? pathSeg.join('/') : pathSeg || '';
    const url = new URL(`${target}/${basePath}`);
    // 透传查询参数
    searchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
    });
    return url;
}

async function handleRequest(request, context) {
    const { endHostName, path } = await context.params;
    const config = loadConfig();

    const upstreamUrl = buildUpstreamUrl(endHostName, path, request.nextUrl.searchParams, config.apiProxy);
    if (!upstreamUrl) {
        return NextResponse.json(
            { error: `未知的 EndHost: ${endHostName}`, available: Object.keys(config.apiProxy || {}) },
            { status: 404 }
        );
    }

    // 构造转发请求头
    const headers = {};
    request.headers.forEach((v, k) => {
        if (DROP_REQ_HEADERS.has(k.toLowerCase())) return;
        headers[k] = v;
    });

    const init = { method: request.method, headers, redirect: 'manual' };
    if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = await request.arrayBuffer();
    }

    let upstream;
    try {
        upstream = await fetch(upstreamUrl, init);
    } catch (err) {
        return NextResponse.json(
            { error: '代理请求失败', message: err.message, upstream: upstreamUrl.toString() },
            { status: 502 }
        );
    }

    // 透传响应状态与安全响应头
    const resHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
        if (DROP_RES_HEADERS.has(k.toLowerCase())) return;
        resHeaders.set(k, v);
    });

    // 流式回写响应体：upstream.body 已是 ReadableStream，直接透传
    return new Response(upstream.body, {
        status: upstream.status,
        headers: resHeaders,
    });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const HEAD = handleRequest;
export const OPTIONS = handleRequest;
