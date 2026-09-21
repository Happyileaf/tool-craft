import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

/**
 * 站点名，页头与浏览器标题共用
 */
const SITE_NAME = 'ToolCraft 工具箱';

/**
 * 站点级元信息，各工具页通过 title 模板追加页面标题
 */
const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s - ${SITE_NAME}`,
  },
  description: '以 Capability 为核心的在线工具平台，所有工具均在浏览器本地完成计算，数据不出本机',
};

/**
 * 根布局：站点级页头、页脚与全局样式入口
 */
function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-gray-900">
              {SITE_NAME}
            </Link>
            <p className="text-sm text-gray-500">全部计算在浏览器本地完成</p>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 text-center text-xs text-gray-400">
            ToolCraft · 以 Capability 为核心的在线工具平台 · 数据不离开你的浏览器
          </div>
        </footer>
      </body>
    </html>
  );
}

export { metadata };

export default RootLayout;
