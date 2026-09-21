'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeModeEnum, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

/**
 * 主题模式切换按钮，按浅色、深色、跟随系统的顺序循环切换
 *
 * @returns 主题模式切换按钮节点
 */
function ThemeSelector() {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const { t } = useI18n();

  const cycleTheme = () => {
    if (themeMode === ThemeModeEnum.LIGHT) {
      setThemeMode(ThemeModeEnum.DARK);
      return;
    }
    if (themeMode === ThemeModeEnum.DARK) {
      setThemeMode(ThemeModeEnum.SYSTEM);
      return;
    }
    setThemeMode(ThemeModeEnum.LIGHT);
  };

  if (themeMode === ThemeModeEnum.LIGHT) {
    return (
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={cycleTheme}
        aria-label={t('common.themeLight')}
        title={t('common.themeLight')}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-all hover:bg-slate-200/80 active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Sun className="h-4 w-4 shrink-0 text-amber-500" />
      </button>
    );
  }

  if (themeMode === ThemeModeEnum.DARK) {
    return (
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={cycleTheme}
        aria-label={t('common.themeDark')}
        title={t('common.themeDark')}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-all hover:bg-slate-200/80 active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Moon className="h-4 w-4 shrink-0 text-indigo-400" />
      </button>
    );
  }

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={cycleTheme}
      aria-label={t('common.themeSystem')}
      title={t('common.themeSystem')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-all hover:bg-slate-200/80 active:scale-90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span className="relative flex items-center justify-center shrink-0">
        <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-slate-900 ${
            resolvedTheme === 'dark' ? 'bg-indigo-400' : 'bg-amber-500'
          }`}
        />
      </span>
    </button>
  );
}

export default ThemeSelector;
