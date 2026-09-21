'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentTools } from '@/lib/recent';
import { getToolBySlug } from '@/tools/registry';

/**
 * 最近使用工具列表，挂载时从本地存储读取访问记录并按注册表元信息渲染入口
 *
 * @returns 存在有效记录时渲染最近使用区块；无有效记录时不渲染任何内容
 */
function RecentTools() {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    setRecentSlugs(getRecentTools());
  }, []);

  const recentTools = recentSlugs
    .map((slug) => getToolBySlug(slug))
    .filter((tool) => tool !== undefined);

  if (recentTools.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">最近使用</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recentTools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-slate-50"
            >
              <span className="font-medium">{tool.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentTools;
