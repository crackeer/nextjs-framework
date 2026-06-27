import { loadConfig } from '../../../lib/config';
import { signToken, TOKEN_MAX_AGE } from '../../../lib/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const config = loadConfig();
    const user = (config.users || []).find(
        (u) => u.username === username && u.password === password
    );
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }

    const payload = {
        u: user.username,
        e: Date.now() + TOKEN_MAX_AGE * 1000,
    };
    const token = await signToken(payload, config.secret);

    res.setHeader(
        'Set-Cookie',
        `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE}`
    );
    return res.status(200).json({ ok: true, user: { username: user.username } });
}
