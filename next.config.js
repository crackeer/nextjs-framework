const createMDX = require('@next/mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 让 Next.js 把 .md / .mdx 也当作页面
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // 产出最小化独立运行包：.next/standalone（含精简 node_modules），
    // 便于直接复制到镜像或服务器单独运行，无需再 npm install
    output: 'standalone',
    // 允许开发模式下从这些来源访问（预览/本地 IP），避免 HMR 跨域被拦截
    allowedDevOrigins: ['127.0.0.1', 'localhost', '*.trae.cn'],
    // API 代理：对外暴露 /proxy/{endHostName}/path*，
    // 内部转交 pages/api/proxy/[endHostName]/[...path].js 处理
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
