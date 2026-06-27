// 生产模式启动：从 config 读取端口与 secret，注入环境变量后启动自定义服务器
// 自定义服务器（server.mjs）在 Next.js 之上叠加 WebSocket，用于 SSH 终端
const { spawn } = require('child_process');
const path = require('path');

const config = require(path.join(__dirname, '..', 'config', 'app.config.js'));
const port = String(config.port || process.env.PORT || 9393);
const hostname = config.host || '0.0.0.0';

const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    HOSTNAME: hostname,
    APP_SECRET: config.secret || process.env.APP_SECRET || '',
};

const child = spawn('node', ['server.mjs'], {
    stdio: 'inherit',
    env,
    cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => process.exit(code ?? 0));
