import type { NextConfig } from 'next';

/**
 * Next.js 配置
 * workspace 内部包以 TS 源码直接消费（exports 指向 src），需纳入 Next 编译范围
 */
const nextConfig: NextConfig = {
  transpilePackages: ['@tool-craft/core', '@tool-craft/capabilities'],
};

export default nextConfig;
