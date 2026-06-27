// 生产模式启动：从 config 读取端口与 secret，注入环境变量后启动 standalone server
const { spawn } = require('child_process');
const path = require('path');

const config = require(path.join(__dirname, '..', 'config', 'app.config.js'));
const port = String(config.port || process.env.PORT || 9393);
const hostname = config.host || '0.0.0.0';

const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');

const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    HOSTNAME: hostname,
    APP_SECRET: config.secret || process.env.APP_SECRET || '',
};

const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    env,
    cwd: path.join(__dirname, '..', '.next', 'standalone'),
});

child.on('exit', (code) => process.exit(code ?? 0));
