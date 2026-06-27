// 开发模式启动：从 config 读取端口与 secret，注入环境变量后启动 next dev
const { spawn } = require('child_process');
const path = require('path');

const config = require(path.join(__dirname, '..', 'config', 'app.config.js'));
const port = String(config.port || 3000);

const env = {
    ...process.env,
    NODE_ENV: 'development',
    APP_SECRET: config.secret || process.env.APP_SECRET || '',
};

const child = spawn('npx', ['next', 'dev', '-p', port], {
    stdio: 'inherit',
    env,
    cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => process.exit(code ?? 0));
