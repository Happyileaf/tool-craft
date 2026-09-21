'use client';

import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import ToolIcon from '@/components/tool-icon';
import { useFavorites } from '@/lib/storage';
import { useI18n, LanguageEnum } from '@/lib/i18n';
import type { ToolMeta } from '@/tools/types';

/**
 * 工具列表行组件属性
 */
interface ToolListRowProps {
  /** 待展示的工具元数据 */
  tool: ToolMeta;
}

/**
 * 目录高密度列表中的单个工具行，展示图标、双语名称、说明、标签、收藏与使用入口
 *
 * @param props - 组件属性
 * @param props.tool - 待展示的工具元数据
 * @returns 可整行点击的工具列表行节点
 */
function ToolListRow({ tool }: ToolListRowProps) {
  const { t, language } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFavorited = isFavorite(tool.slug);
  const toolName = language === LanguageEnum.EN ? tool.nameEn : tool.name;
  const toolNameAlt = language === LanguageEnum.EN ? tool.name : tool.nameEn;
  const toolDescription =
    language === LanguageEnum.EN ? tool.descriptionEn : tool.description;
  const toolTags = language === LanguageEnum.EN ? tool.tagsEn : tool.tags;

  return (
    <div className="group relative flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <Link
        href={tool.path}
        aria-label={toolName}
        className="absolute inset-0 z-0"
      />

      <div className="flex min-w-0 items-center gap-3.5 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
          <ToolIcon name={tool.iconName} className="h-4 w-4" />
        </div>
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {toolName}
            </span>
            <span className="hidden font-mono text-xs text-slate-400 dark:text-slate-500 md:inline">
              {toolNameAlt}
            </span>
          </div>
          <span className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {toolDescription}
          </span>
        </div>
      </div>

      <div className="relative z-10 ml-4 flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-1.5 sm:flex">
          {toolTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(tool.slug)}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"
          title={
            isFavorited
              ? t('hub.removeFromFavorite')
              : t('hub.addToFavorite')
          }
          aria-label={
            isFavorited
              ? t('hub.removeFromFavorite')
              : t('hub.addToFavorite')
          }
        >
          <Star
            className={`h-4 w-4 ${
              isFavorited
                ? 'fill-amber-500 text-amber-500'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>

        <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
          <span>{t('common.useNow')}</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

export default ToolListRow;
