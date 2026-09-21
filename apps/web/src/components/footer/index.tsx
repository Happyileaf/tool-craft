'use client';

import Link from 'next/link';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  ToolCategoryEnum,
  ToolCategoryOptions,
} from '@/tools/constants';
import { PM_MODAL_OPEN_EVENT } from '@/components/pm-design-modal/constants';

/**
 * 站点页脚，提供品牌说明、分类导航、收藏库与 PM 设计说明入口
 *
 * @returns 页脚节点
 */
function Footer() {
  const { t } = useI18n();

  const functionalCategories = ToolCategoryOptions.filter(
    (option) => option.value !== ToolCategoryEnum.ALL,
  );

  const openPmModal = () => {
    window.dispatchEvent(new Event(PM_MODAL_OPEN_EVENT));
  };

  return (
    <footer className="mt-auto w-full border-t border-slate-200 bg-slate-50/80 transition-colors dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 pb-8 border-b border-slate-200 md:grid-cols-12 dark:border-slate-800">
          <div className="flex flex-col gap-3 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold shadow-xs dark:bg-slate-100">
                <Zap className="h-4 w-4 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('common.brandName')}
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('footer.brandDesc')}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>{t('footer.privacyGuarantee')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.categories')}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-3">
              {functionalCategories.map((option) => (
                <Link
                  key={option.value}
                  href={`/category/${option.value}`}
                  className="truncate text-left text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {t(`categories.${option.value}`)}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.platformSupport')}
            </h3>
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Link
                href="/library"
                className="text-left transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                {t('footer.favoritesAndHistory')}
              </Link>
              <button
                type="button"
                onClick={openPmModal}
                className="flex items-center gap-1.5 text-left font-medium text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t('footer.pmModal')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[11px] text-slate-400 sm:flex-row dark:text-slate-500">
          <div>
            © {new Date().getFullYear()} ToolCraft. {t('footer.copyright')}
          </div>
          <div className="flex items-center gap-3">
            <span>{t('footer.themeAuto')}</span>
            <span>·</span>
            <span>{t('footer.allClientExecution')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
