import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';
import { signToken, TOKEN_MAX_AGE } from '../../../../lib/auth';

export async function POST(request) {
    const { username, password } = await request.json().catch(() => ({}));
    if (!username || !password) {
        return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    const config = loadConfig();
    const user = (config.users || []).find((u) => u.username === username && u.password === password);
    if (!user) {
        return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const payload = {
        u: user.username,
        e: Date.now() + TOKEN_MAX_AGE * 1000,
    };
    const token = await signToken(payload, config.secret);

    const res = NextResponse.json({ ok: true, user: { username: user.username } });
    res.cookies.set('auth_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE,
    });
    return res;
}
