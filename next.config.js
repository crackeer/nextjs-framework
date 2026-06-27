const createMDX = require('@next/mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 让 Next.js 把 .md / .mdx 也当作页面
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // 仅在执行 `npm run export` / `npm run simple-export` 时做静态导出
    // （EXPORT=1），其余场景保持 SSR 可用，避免影响 dev / start
    ...(process.env.EXPORT ? { output: 'export' } : {}),
};

const withMDX = createMDX({});

module.exports = withMDX(nextConfig);
