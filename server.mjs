// 自定义 Next.js 服务器：在标准 HTTP 服务之上叠加 WebSocket，用于 Web 终端
// ------------------------------------------------------------------
// App Router 原生不支持 WebSocket 路由，因此采用 custom server 方案：
//   - HTTP 请求交给 Next.js 处理（含 proxy.js 鉴权、API 路由、页面）
//   - WebSocket 升级请求（/api/ssh/ws）由本文件直接处理，建立 SSH 连接
//
// 通信协议：
//   客户端 -> 服务端
//     二进制帧 = 终端输入（stdin）
//     文本帧   = JSON 控制消息，如 {"type":"resize","cols":80,"rows":24}
//   服务端 -> 客户端
//     二进制帧 = 终端输出（stdout/stderr）
//     文本帧   = JSON 事件，如 {"type":"connected"} / {"type":"error","message":"..."}
import { createServer } from 'http';
import next from 'next';
import { WebSocketServer } from 'ws';
import ssh2 from 'ssh2';
import { verifyToken } from './lib/auth.js';
import { loadConfig } from './lib/config.js';

const { Client } = ssh2;
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// 解析 Cookie 头（不引入额外依赖）
function parseCookies(header) {
    const cookies = {};
    if (!header) return cookies;
    header.split(';').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return;
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        cookies[k] = v;
    });
    return cookies;
}

function safeSend(ws, obj) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

// 建立 SSH 连接并桥接到 WebSocket
function handleSshConnection(ws, req) {
    const url = new URL(req.url, 'http://localhost');
    const hostName = url.searchParams.get('host');
    const cols = parseInt(url.searchParams.get('cols') || '80', 10);
    const rows = parseInt(url.searchParams.get('rows') || '24', 10);

    // 1. 鉴权：从 Cookie 读取 auth_token 并校验
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.auth_token;
    const secret = process.env.APP_SECRET || loadConfig().secret;
    verifyToken(token, secret).then((payload) => {
        if (!payload) {
            safeSend(ws, { type: 'error', message: '未登录或登录已过期' });
            ws.close(4001, 'Unauthorized');
            return;
        }

        // 2. 查找 SSH 配置
        const config = loadConfig();
        const sshConfig = (config.ssh || []).find((s) => s.name === hostName);
        if (!sshConfig) {
            safeSend(ws, { type: 'error', message: `未知的 SSH 主机: ${hostName}` });
            ws.close(4004, 'Host not found');
            return;
        }

        // 3. 建立 SSH 连接
        const conn = new Client();
        let stream = null;

        conn.on('ready', () => {
            conn.shell({ term: 'xterm-256color', cols, rows }, (err, s) => {
                if (err) {
                    safeSend(ws, { type: 'error', message: '打开 shell 失败: ' + err.message });
                    conn.end();
                    return;
                }
                stream = s;
                safeSend(ws, { type: 'connected' });
                // 终端输出 -> 客户端（二进制）
                s.on('data', (data) => {
                    if (ws.readyState === ws.OPEN) ws.send(data);
                });
                s.stderr.on('data', (data) => {
                    if (ws.readyState === ws.OPEN) ws.send(data);
                });
                s.on('close', () => {
                    safeSend(ws, { type: 'closed', message: '远程 shell 已关闭' });
                    conn.end();
                });
            });
        });

        conn.on('error', (err) => {
            safeSend(ws, { type: 'error', message: 'SSH 连接错误: ' + err.message });
        });

        conn.on('close', () => {
            safeSend(ws, { type: 'closed', message: 'SSH 连接已断开' });
            ws.close(1000, 'SSH closed');
        });

        // 连接参数
        const connectOpts = {
            host: sshConfig.host,
            port: sshConfig.port || 22,
            username: sshConfig.username,
            readyTimeout: 15000,
        };
        if (sshConfig.privateKey) {
            connectOpts.privateKey = sshConfig.privateKey;
            if (sshConfig.passphrase) connectOpts.passphrase = sshConfig.passphrase;
        } else if (sshConfig.password) {
            connectOpts.password = sshConfig.password;
        }
        conn.connect(connectOpts);

        // 4. 处理客户端消息
        ws.on('message', (data, isBinary) => {
            if (isBinary) {
                // 二进制 = 终端输入
                if (stream) stream.write(data);
            } else {
                // 文本 = JSON 控制消息
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'resize' && stream) {
                        stream.setWindow(msg.rows, msg.cols, 0, 0);
                    }
                } catch {
                    /* 忽略非法 JSON */
                }
            }
        });

        // 5. 清理
        ws.on('close', () => {
            if (stream) {
                try { stream.end(); } catch { /* ignore */ }
            }
            try { conn.end(); } catch { /* ignore */ }
        });
    });
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res);
    });

    // WebSocket：使用 noServer 模式，只接管 /api/ssh/ws，其余升级请求（如 HMR）交给 Next
    const wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (req, socket, head) => {
        const { pathname } = new URL(req.url, 'http://localhost');
        if (pathname === '/api/ssh/ws') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        }
        // 非 SSH 路径不做处理，让其它 upgrade 监听器（Next HMR）自行处理
    });
    wss.on('connection', handleSshConnection);

    server.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port} (dev=${dev})`);
    });
});
