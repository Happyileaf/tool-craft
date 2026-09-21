import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import CommandPalette from '@/components/command-palette';
import Footer from '@/components/footer';
import Header from '@/components/header';
import PmDesignModal from '@/components/pm-design-modal';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import './globals.css';

/**
 * 站点级元数据，用于浏览器标签与搜索引擎结果展示
 */
export const metadata: Metadata = {
  title: 'ToolCraft',
  description: '纯前端、隐私优先的在线工具箱，所有处理均在浏览器本地完成。',
};

/**
 * 页面首次绘制前同步执行的主题初始化脚本，避免深浅模式闪烁
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('toolcraft-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || ((stored !== 'light') && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (error) {}
})();
`;

/**
 * 应用根布局，统一承载站点导航、全局能力提供者与各页面内容
 *
 * @param props - 根布局属性
 * @param props.children - 当前路由渲染的页面节点
 * @returns 包裹通用结构后的完整 HTML 文档树
 */
function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider>
          <I18nProvider>
            <Header />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <CommandPalette />
            <PmDesignModal />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
