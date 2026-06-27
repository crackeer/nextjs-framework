import { NextResponse } from 'next/server';
import { loadConfig } from '../../../../lib/config';
import { verifyToken } from '../../../../lib/auth';

export async function GET(request) {
    const token = request.cookies.get('auth_token')?.value;
    const { secret } = loadConfig();
    const payload = await verifyToken(token, secret);
    if (!payload) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: { username: payload.u } });
}
