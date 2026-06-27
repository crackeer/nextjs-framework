import { loadConfig } from '../../../lib/config';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
    const token = req.cookies.auth_token;
    const { secret } = loadConfig();
    const payload = await verifyToken(token, secret);
    if (!payload) {
        return res.status(401).json({ user: null });
    }
    return res.status(200).json({ user: { username: payload.u } });
}
