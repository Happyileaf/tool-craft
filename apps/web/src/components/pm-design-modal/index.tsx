'use client';

import { useEffect, useState } from 'react';
import { Layers, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { PM_MODAL_OPEN_EVENT } from './constants';

/**
 * PM 设计说明弹窗，展示产品定位、架构原则与演进规划，由 Footer 链接触发
 *
 * @returns 弹窗节点；关闭状态下返回 null
 */
function PmDesignModal() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(PM_MODAL_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(PM_MODAL_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const principles = [
    { title: t('pmModal.p1Title'), desc: t('pmModal.p1Desc') },
    { title: t('pmModal.p2Title'), desc: t('pmModal.p2Desc') },
    { title: t('pmModal.p3Title'), desc: t('pmModal.p3Desc') },
    { title: t('pmModal.p4Title'), desc: t('pmModal.p4Desc') },
  ];

  const roadmapItems = [t('pmModal.r1'), t('pmModal.r2'), t('pmModal.r3')];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-900 p-2 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-400 dark:text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('pmModal.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('pmModal.badge')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6 text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Layers className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>{t('pmModal.introTitle')}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {t('pmModal.introText')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Zap className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>{t('pmModal.principlesTitle')}</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {principles.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-1 font-semibold text-slate-900 dark:text-white">
                    {principle.title}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {principle.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('pmModal.roadmapTitle')}</span>
            </div>
            <ul className="ml-5 list-disc space-y-1 text-slate-600 dark:text-slate-400">
              {roadmapItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {t('pmModal.closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PmDesignModal;
