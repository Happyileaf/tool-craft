import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '@/components/header';
import './globals.css';

/**
 * 站点级元数据，用于浏览器标签与搜索引擎结果展示
 */
export const metadata: Metadata = {
  title: 'Tool-Craft',
  description: '纯前端、隐私优先的在线工具箱，所有处理均在浏览器本地完成。',
};

/**
 * 应用根布局，统一承载站点导航与各页面内容
 *
 * @param props - 根布局属性
 * @param props.children - 当前路由渲染的页面节点
 * @returns 包裹通用结构后的完整 HTML 文档树
 */
function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
