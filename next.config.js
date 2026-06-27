const createMDX = require('@next/mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 让 Next.js 把 .md / .mdx 也当作页面
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // 使用自定义服务器（server.mjs）以支持 WebSocket（SSH 终端），
    // 因此不再使用 standalone 输出模式
    // 允许开发模式下从这些来源访问（预览/本地 IP），避免 HMR 跨域被拦截
    allowedDevOrigins: ['127.0.0.1', 'localhost', '*.trae.cn'],
    // ali-oss 依赖的 urllib 会动态 require proxy-agent 等 Node 原生模块，
    // Turbopack 无法打包，需标记为 server 外部依赖
    serverExternalPackages: ['ali-oss', 'urllib', 'proxy-agent', 'socks-proxy-agent', 'http-proxy-agent', 'https-proxy-agent'],
    // API 代理：对外暴露 /proxy/{endHostName}/path*，
    // 内部转交 app/api/proxy/[endHostName]/[...path]/route.js 处理
    async rewrites() {
        return [
            {
                source: '/proxy/:endHostName/:path*',
                destination: '/api/proxy/:endHostName/:path*',
            },
        ];
    },
};

const withMDX = createMDX({});

module.exports = withMDX(nextConfig);
