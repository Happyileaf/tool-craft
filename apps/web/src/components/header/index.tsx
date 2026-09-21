'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Zap } from 'lucide-react';
import GithubIcon from '@/components/icons/github-icon';
import LanguageSelector from '@/components/language-selector';
import ThemeSelector from '@/components/theme-selector';
import { useI18n } from '@/lib/i18n';
import { COMMAND_PALETTE_OPEN_EVENT } from '@/lib/command-palette';
import { cn } from '@/lib/utils';

/**
 * 常用与足迹页的路由路径
 */
const LIBRARY_PATH = '/library';

/**
 * 站点顶部导航栏，提供品牌入口、页面导航、全局搜索触发、语言与主题切换能力
 *
 * @returns 顶部导航栏节点
 */
function Header() {
  const pathname = usePathname();
  const { t } = useI18n();

  const isLibraryActive = pathname === LIBRARY_PATH;
  const isHubActive = !isLibraryActive;

  const openCommandPalette = () => {
    window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            id="brand-logo-btn"
            href="/"
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 font-bold shadow-xs transition-transform group-hover:scale-105 dark:bg-slate-100">
              <Zap className="h-4 w-4 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                  {t('common.brandName')}
                </span>
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Web
                </span>
              </div>
              <span className="hidden text-[10px] leading-none text-slate-400 sm:inline dark:text-slate-500">
                {t('common.tagline')}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              id="nav-all-tools-btn"
              href="/"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isHubActive
                  ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white',
              )}
            >
              {t('header.allTools')}
            </Link>
            <Link
              id="nav-library-btn"
              href={LIBRARY_PATH}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isLibraryActive
                  ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white',
              )}
            >
              {t('header.favorites')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="global-search-trigger"
            type="button"
            onClick={openCommandPalette}
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100 px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Search className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">
              {t('common.searchPlaceholder')}
            </span>
            <span className="sm:hidden">{t('common.searchShort')}</span>
            <kbd className="hidden items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {t('header.searchShortcut')}
            </kbd>
          </button>

          <LanguageSelector />

          <ThemeSelector />

          <a
            id="github-repo-link"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title={t('header.githubRepo')}
            aria-label={t('header.githubAria')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-all hover:bg-slate-200/80 active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
