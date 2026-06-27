// 登录令牌工具：使用 Web Crypto（globalThis.crypto），Node 18+ 与 Edge 运行时均可使用
const enc = new TextEncoder();

function b64urlEncode(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function getKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/** 签发令牌：payload 形如 { u: username, e: 过期时间戳(ms) } */
export async function signToken(payload, secret) {
    const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
    const key = await getKey(secret);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(p));
    return p + '.' + b64urlEncode(sig);
}

/** 校验令牌：通过返回 payload，失败返回 null */
export async function verifyToken(token, secret) {
    if (!token) return null;
    const [p, sig] = token.split('.');
    if (!p || !sig) return null;
    const key = await getKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(p));
    if (!ok) return null;
    try {
        const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
        if (payload.e && payload.e < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

/** 令牌有效期：7 天 */
export const TOKEN_MAX_AGE = 7 * 24 * 3600;
