'use client';

import { useMemo, useState } from 'react';
import { Grid3X3, List, Search } from 'lucide-react';
import ToolCard from '@/components/tool-card';
import ToolIcon from '@/components/tool-icon';
import ToolListRow from './tool-list-row';
import { ViewModeEnum } from './constants';
import { useI18n } from '@/lib/i18n';
import {
  ToolCategoryEnum,
  ToolCategoryIconMap,
  ToolCategoryOptions,
} from '@/tools/constants';
import { tools } from '@/tools/registry';
import type { ToolMeta } from '@/tools/types';

/**
 * 工具广场，提供 Hero 介绍、关键词搜索、分类筛选以及网格与列表两种密度视图
 *
 * @returns 工具广场完整内容节点
 */
function ToolsHub() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategoryEnum>(
    ToolCategoryEnum.ALL,
  );
  const [viewMode, setViewMode] = useState<ViewModeEnum>(ViewModeEnum.GRID);

  const categoryCounts = useMemo(() => {
    const counts = new Map<ToolCategoryEnum, number>();
    for (const option of ToolCategoryOptions) {
      counts.set(
        option.value,
        option.value === ToolCategoryEnum.ALL
          ? tools.length
          : tools.filter((tool) => tool.category === option.value).length,
      );
    }
    return counts;
  }, []);

  const filteredTools = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    let list = tools.filter((tool) => {
      const matchesCategory =
        activeCategory === ToolCategoryEnum.ALL ||
        tool.category === activeCategory;
      if (!matchesCategory) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [
        tool.slug,
        tool.name,
        tool.nameEn,
        tool.description,
        tool.descriptionEn,
        ...tool.tags,
        ...tool.tagsEn,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });

    list = [...list].sort(
      (current, next) => Number(next.isPopular) - Number(current.isPopular),
    );

    return list;
  }, [activeCategory, searchQuery]);

  const activeCategoryName = t(`categories.${activeCategory}`);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory(ToolCategoryEnum.ALL);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 pt-2 text-center sm:pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>{t('hub.heroBadge')}</span>
        </div>

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
          {t('hub.heroTitle')}
          <br className="hidden sm:inline" />
          {t('hub.heroTitleSub')}
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
          {t('hub.heroDesc')}
        </p>

        <div className="relative mt-2 w-full">
          <div className="relative flex items-center overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-xs transition-colors hover:border-slate-400 focus-within:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:focus-within:border-slate-400">
            <Search className="ml-4 mr-2 h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('hub.searchPlaceholder')}
              className="w-full border-0 bg-transparent py-3.5 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base dark:text-white dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mr-3 cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t('hub.clearSearch')}
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-1.5 pt-2">
          {ToolCategoryOptions.map((option) => {
            const isActive = activeCategory === option.value;
            const count = categoryCounts.get(option.value) ?? 0;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveCategory(option.value)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 font-semibold text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <ToolIcon
                  name={ToolCategoryIconMap[option.value]}
                  className="h-3.5 w-3.5"
                />
                <span>{t(`categories.${option.value}`)}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? 'bg-slate-800 text-slate-300 dark:bg-slate-200 dark:text-slate-700'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeCategoryName}
            </h2>
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
              ({filteredTools.length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                id="view-mode-grid-btn"
                type="button"
                onClick={() => setViewMode(ViewModeEnum.GRID)}
                className={`cursor-pointer rounded p-1.5 text-xs transition-colors ${
                  viewMode === ViewModeEnum.GRID
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={t('hub.viewGrid')}
                aria-label={t('hub.viewGrid')}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                id="view-mode-list-btn"
                type="button"
                onClick={() => setViewMode(ViewModeEnum.LIST)}
                className={`cursor-pointer rounded p-1.5 text-xs transition-colors ${
                  viewMode === ViewModeEnum.LIST
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={t('hub.viewList')}
                aria-label={t('hub.viewList')}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('hub.noResultsTitle')}
            </div>
            <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">
              {t('hub.noResultsDesc')}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {t('hub.viewAllTools')}
            </button>
          </div>
        ) : viewMode === ViewModeEnum.GRID ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool: ToolMeta) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {filteredTools.map((tool: ToolMeta) => (
              <ToolListRow key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ToolsHub;
