'use client';

import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import ToolIcon from '@/components/tool-icon';
import { useFavorites } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import { LanguageEnum } from '@/lib/i18n';
import type { ToolMeta } from '@/tools/types';

/**
 * 工具入口卡片组件属性
 */
interface ToolCardProps {
  /** 待展示的工具元数据 */
  tool: ToolMeta;
}

/**
 * 工具入口卡片，展示工具图标、双语名称、用途说明、收藏入口与本地运算标识
 *
 * @param props - 组件属性
 * @param props.tool - 待展示的工具元数据
 * @returns 指向工具详情页的卡片节点
 */
function ToolCard({ tool }: ToolCardProps) {
  const { t, language } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFavorited = isFavorite(tool.slug);
  const toolName = language === LanguageEnum.EN ? tool.nameEn : tool.name;
  const toolNameAlt = language === LanguageEnum.EN ? tool.name : tool.nameEn;
  const toolDescription =
    language === LanguageEnum.EN ? tool.descriptionEn : tool.description;

  return (
    <div className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link href={tool.path} className="min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shadow-2xs transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
              <ToolIcon name={tool.iconName} className="h-5 w-5" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => toggleFavorite(tool.slug)}
            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-amber-500"
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
        </div>

        <Link href={tool.path}>
          <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-white dark:group-hover:text-white">
            {toolName}
          </h3>
          <div className="mb-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {toolNameAlt}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {toolDescription}
          </p>
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800/80">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>{t('common.clientSideExecution')}</span>
        </div>

        <Link
          href={tool.path}
          className="flex items-center gap-1 font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
        >
          <span>{t('common.useNow')}</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export default ToolCard;
