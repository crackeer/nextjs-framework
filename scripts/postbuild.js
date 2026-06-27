// standalone 构建后处理：standalone 产物不含 public/ 与 .next/static，
// 需手动复制进 standalone 目录，服务才能正确响应静态资源
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const standaloneDir = path.join(root, '.next', 'standalone');

function copy(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.cpSync(src, dest, { recursive: true });
}

if (!fs.existsSync(standaloneDir)) {
    console.error('[postbuild] .next/standalone not found, skip.');
    process.exit(0);
}

// 静态资源与构建产物
copy(path.join(root, 'public'), path.join(standaloneDir, 'public'));
copy(
    path.join(root, '.next', 'static'),
    path.join(standaloneDir, '.next', 'static')
);

// 全局 APP 配置：运行时由 lib/config.js 读取，需一并复制进 standalone
copy(path.join(root, 'config'), path.join(standaloneDir, 'config'));

console.log('[postbuild] copied public/, .next/static, config/ into .next/standalone');
