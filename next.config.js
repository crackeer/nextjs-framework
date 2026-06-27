const createMDX = require('@next/mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 让 Next.js 把 .md / .mdx 也当作页面
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // 产出最小化独立运行包：.next/standalone（含精简 node_modules），
    // 便于直接复制到镜像或服务器单独运行，无需再 npm install
    output: 'standalone',
};

const withMDX = createMDX({});

module.exports = withMDX(nextConfig);
