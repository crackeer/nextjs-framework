const createMDX = require('@next/mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 让 Next.js 把 .md / .mdx 也当作页面
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

const withMDX = createMDX({});

module.exports = withMDX(nextConfig);
