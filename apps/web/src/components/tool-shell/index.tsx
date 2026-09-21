import Link from 'next/link';
import type { ReactNode } from 'react';

/** 工具页外壳属性 */
type ToolShellProps = {
  /** 工具标题 */
  title: string;
  /** 工具描述，展示在标题下方 */
  description: string;
  /** 工具主体内容 */
  children: ReactNode;
};

/**
 * 工具页外壳：统一承载标题、描述与返回首页入口，包裹各工具的主体内容
 */
function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← 返回首页
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default ToolShell;
