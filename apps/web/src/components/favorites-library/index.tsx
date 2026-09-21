'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Clock,
  Info,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import ToolIcon from '@/components/tool-icon';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/lib/storage/use-favorites';
import { useRecent } from '@/lib/storage/use-recent';
import { useTracking } from '@/lib/storage/use-tracking';
import { tools } from '@/tools/registry';
import type { ToolMeta } from '@/tools/types';
import { LibraryTabEnum } from './constants';

/**
 * 收藏库面板，聚合本地收藏与近期使用足迹，数据均来自浏览器本地存储
 *
 * @returns 收藏库完整界面
 */
function FavoritesLibrary() {
  const { t, language } = useI18n();
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { recentRecords, clearRecentRecords } = useRecent();
  const { isTrackingEnabled, setTrackingEnabled } = useTracking();
  const [activeTab, setActiveTab] = useState<LibraryTabEnum>(
    LibraryTabEnum.FAVORITES,
  );
  const [showClearFavoritesConfirm, setShowClearFavoritesConfirm] =
    useState(false);
  const [showClearRecentConfirm, setShowClearRecentConfirm] = useState(false);

  const isEnglish = language === 'en';

  const favoriteTools = tools.filter((tool) => favorites.includes(tool.slug));

  const recentTools = recentRecords
    .map((record) => tools.find((tool) => tool.slug === record.slug))
    .filter((tool): tool is ToolMeta => Boolean(tool));

  const getToolName = (tool: ToolMeta) =>
    isEnglish ? tool.nameEn : tool.name;

  const getToolDescription = (tool: ToolMeta) =>
    isEnglish ? tool.descriptionEn : tool.description;

  const getToolTag = (tool: ToolMeta) =>
    isEnglish
      ? (tool.tagsEn[0] ?? tool.tags[0] ?? t('common.clientSideExecution'))
      : (tool.tags[0] ?? t('common.clientSideExecution'));

  const renderToolCard = (tool: ToolMeta, actionLabel: string) => {
    const isFavorited = favorites.includes(tool.slug);
    return (
      <div
        key={tool.slug}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <Link
          href={tool.path}
          aria-label={getToolName(tool)}
          className="absolute inset-0 z-0"
        />
        <div>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shadow-xs transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
              <ToolIcon name={tool.iconName} className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(tool.slug)}
              className={`relative z-10 rounded-lg p-1.5 transition-colors ${
                isFavorited
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-300 hover:bg-amber-50 hover:text-amber-500 dark:text-slate-600 dark:hover:bg-amber-950/40'
              }`}
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
                className={`h-4 w-4 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`}
              />
            </button>
          </div>
          <h2 className="text-sm font-bold text-slate-900 transition-colors dark:text-white">
            {getToolName(tool)}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {getToolDescription(tool)}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {getToolTag(tool)}
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
            {actionLabel}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  };

  const renderEmptyState = (
    icon: React.ReactNode,
    title: string,
    description: string,
  ) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {t('hub.viewAllTools')}
      </Link>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* 顶部面包屑与隐私徽标 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          <Link
            id="back-to-hub-from-library-btn"
            href="/"
            className="flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {t('library.backToHub')}
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {t('library.quickManage')}
          </span>
          <span>/</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {t('library.title')}
          </span>
        </div>
        <div className="hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 sm:flex dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {t('common.clientSideExecution')} · {t('library.zeroUpload')}
          </span>
        </div>
      </div>

      {/* 页头与标签切换 */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {t('library.title')}
              </h1>
              <span className="font-mono text-xs font-normal text-slate-400 dark:text-slate-500">
                {t('library.subtitle')}
              </span>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
              {t('library.desc')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center self-start rounded-xl border border-slate-200 bg-slate-200/70 p-1 lg:self-center dark:border-slate-700/60 dark:bg-slate-800/80">
          <button
            id="tab-favorites-btn"
            type="button"
            onClick={() => {
              setActiveTab(LibraryTabEnum.FAVORITES);
              setShowClearFavoritesConfirm(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === LibraryTabEnum.FAVORITES
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${activeTab === LibraryTabEnum.FAVORITES ? 'fill-amber-500 text-amber-500' : ''}`}
            />
            <span>{t('library.tabFavorites')}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {favoriteTools.length}
            </span>
          </button>
          <button
            id="tab-recent-btn"
            type="button"
            onClick={() => {
              setActiveTab(LibraryTabEnum.RECENT);
              setShowClearFavoritesConfirm(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === LibraryTabEnum.RECENT
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{t('library.tabRecent')}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {recentTools.length}
            </span>
          </button>
        </div>
      </div>

      {/* 机制说明、足迹开关与清空操作 */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Info className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                {t('library.mechanismTitle')}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors ${
                  isTrackingEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-200/80 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isTrackingEnabled ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {isTrackingEnabled
                  ? t('library.trackingOn')
                  : t('library.trackingOff')}
              </span>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('library.mechanismDesc')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 pl-11 lg:pl-0">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs dark:border-slate-700/80 dark:bg-slate-800">
            <span className="min-w-[3.5rem] select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isTrackingEnabled
                ? t('library.trackingOn')
                : t('library.enableTracking')}
            </span>
            <button
              id="toggle-tracking-switch-btn"
              type="button"
              role="switch"
              aria-checked={isTrackingEnabled}
              onClick={() => {
                setShowClearRecentConfirm(false);
                setTrackingEnabled(!isTrackingEnabled);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:focus:ring-slate-400 ${
                isTrackingEnabled
                  ? 'bg-emerald-600'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  isTrackingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {showClearRecentConfirm && isTrackingEnabled ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {t('library.confirmClear')}
              </span>
              <button
                id="confirm-clear-recent-banner-btn"
                type="button"
                onClick={() => {
                  clearRecentRecords();
                  setShowClearRecentConfirm(false);
                }}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
              >
                {t('common.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setShowClearRecentConfirm(false)}
                className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button
              id="clear-all-recent-history-btn"
              type="button"
              disabled={!isTrackingEnabled || recentTools.length === 0}
              onClick={() => setShowClearRecentConfirm(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                isTrackingEnabled && recentTools.length > 0
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-600 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-900/60 dark:hover:text-rose-400'
                  : 'cursor-not-allowed border-slate-200/60 bg-slate-100/60 text-slate-400 opacity-70 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-600'
              }`}
              title={
                !isTrackingEnabled
                  ? t('library.trackingOff')
                  : recentTools.length > 0
                    ? t('library.clearRecentHistory')
                    : t('library.noRecentHistory')
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>{t('library.clearRecentHistory')}</span>
              {isTrackingEnabled && recentTools.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {recentTools.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 标签面板主体 */}
      {activeTab === LibraryTabEnum.FAVORITES ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {t('library.favoriteCount', { count: favoriteTools.length })}
            </span>
            {favoriteTools.length > 0 &&
              (showClearFavoritesConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {t('library.confirmClearFav')}
                  </span>
                  <button
                    id="confirm-clear-favorites-btn"
                    type="button"
                    onClick={() => {
                      clearFavorites();
                      setShowClearFavoritesConfirm(false);
                    }}
                    className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-700"
                  >
                    {t('library.confirmClear')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearFavoritesConfirm(false)}
                    className="rounded-md bg-slate-200 px-2 py-1 text-[11px] text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearFavoritesConfirm(true)}
                  className="flex items-center gap-1 text-slate-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t('library.clearFavorites')}</span>
                </button>
              ))}
          </div>
          {favoriteTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteTools.map((tool) =>
                renderToolCard(tool, t('common.open')),
              )}
            </div>
          ) : (
            renderEmptyState(
              <Star className="h-6 w-6 text-amber-500" />,
              t('library.noFavoritesTitle'),
              t('library.noFavoritesDesc'),
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {t('library.recentCount', { count: recentTools.length })}
            </span>
          </div>
          {recentTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentTools.map((tool) =>
                renderToolCard(tool, t('library.continueUse')),
              )}
            </div>
          ) : (
            renderEmptyState(
              <Clock className="h-6 w-6 text-slate-400" />,
              isTrackingEnabled
                ? t('library.noRecentTitle')
                : t('library.trackingNotEnabledTitle'),
              isTrackingEnabled
                ? t('library.noRecentDesc')
                : t('library.trackingDisabledRecentPrompt'),
            )
          )}
        </div>
      )}
    </div>
  );
}

export default FavoritesLibrary;
