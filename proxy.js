import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// 公开路径：登录页、登录相关接口
const PUBLIC_PATHS = ['/login'];

function isPublic(pathname) {
    if (PUBLIC_PATHS.includes(pathname)) return true;
    if (pathname.startsWith('/api/auth')) return true;
    return false;
}

// Next 16：原 middleware 改名为 proxy（文件名与导出函数名都需更新）
export async function proxy(req) {
    const { pathname } = req.nextUrl;
    if (isPublic(pathname)) return NextResponse.next();

    // secret 由启动脚本（scripts/dev.js|start.js）从 config 注入到环境变量，
    // 避免在 proxy 运行时里访问磁盘文件
    const secret = process.env.APP_SECRET || 'please-change-this-to-a-random-string';
    const token = req.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token, secret);
    if (!payload) {
        // 构造登录跳转 URL：优先使用反代头（X-Forwarded-Proto/Host），
        // 避免 HTTPS 预览场景下生成 http://localhost:... 触发 ERR_CLEARTEXT_NOT_PERMITTED
        const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
        const loginUrl = new URL('/login', `${proto}://${host}`);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

// 匹配所有路径，排除静态资源与 Next 内部资源
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
