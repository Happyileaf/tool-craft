'use client';

import Link from 'next/link';
import { useRecent } from '@/lib/storage';
import { formatTimeAgo } from '@/lib/time-ago';
import { useI18n } from '@/lib/i18n';
import { getToolBySlug } from '@/tools/registry';

/**
 * 最近使用工具列表，从本地足迹读取记录并按注册表元信息渲染入口
 *
 * @returns 存在有效记录时渲染最近使用区块；无有效记录时不渲染任何内容
 */
function RecentTools() {
  const { recentRecords } = useRecent();
  const { t } = useI18n();

  const recentTools = recentRecords.flatMap((record) => {
    const tool = getToolBySlug(record.slug);
    return tool
      ? [{ tool, visitedAt: record.visitedAt }]
      : [];
  });

  if (recentTools.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('library.tabRecent')}</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recentTools.map(({ tool, visitedAt }) => (
          <li key={tool.slug}>
            <Link
              href={tool.path}
              className="block rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span className="font-medium">{tool.name}</span>
              <span className="ml-2 text-xs text-slate-500">
                {formatTimeAgo(visitedAt, t)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentTools;
