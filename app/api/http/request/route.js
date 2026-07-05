import { NextResponse } from 'next/server';

const DROP_RES_HEADERS = new Set([
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
]);

export async function POST(request) {
    try {
        const body = await request.json();
        const { method, url, queryParams, headers: reqHeaders, data, contentType } = body;

        if (!method || !url) {
            return NextResponse.json(
                { error: '缺少必要参数：method 和 url' },
                { status: 400 }
            );
        }

        const targetUrl = new URL(url);
        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                targetUrl.searchParams.set(key, value);
            });
        }

        const headers = new Headers();
        if (reqHeaders) {
            Object.entries(reqHeaders).forEach(([key, value]) => {
                headers.set(key, value);
            });
        }

        const init = {
            method: method.toUpperCase(),
            headers,
            redirect: 'follow',
            signal: AbortSignal.timeout(60000),
        };

        if (!['GET', 'HEAD'].includes(init.method)) {
            if (contentType === 'application/x-www-form-urlencoded' && typeof data === 'object') {
                const formData = new URLSearchParams();
                Object.entries(data).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                init.body = formData.toString();
            } else {
                init.body = typeof data === 'object' ? JSON.stringify(data) : data;
            }
            
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', contentType || (typeof data === 'object' ? 'application/json' : 'text/plain'));
            }
        }

        const response = await fetch(targetUrl.toString(), init);

        const resHeaders = new Headers();
        response.headers.forEach((v, k) => {
            if (DROP_RES_HEADERS.has(k.toLowerCase())) return;
            resHeaders.set(k, v);
        });

        const responseContentType = response.headers.get('content-type') || '';
        let responseBody;

        if (responseContentType.includes('application/json')) {
            try {
                responseBody = await response.json();
            } catch {
                responseBody = await response.text();
            }
        } else if (responseContentType.includes('text/')) {
            responseBody = await response.text();
        } else {
            const buffer = await response.arrayBuffer();
            responseBody = Buffer.from(buffer).toString('base64');
            resHeaders.set('x-content-type', responseContentType);
        }

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(resHeaders),
            data: responseBody,
            contentType: responseContentType,
        });

    } catch (err) {
        return NextResponse.json(
            { error: '请求失败', message: err.message },
            { status: 500 }
        );
    }
}