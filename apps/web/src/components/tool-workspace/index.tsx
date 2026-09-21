'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Share2,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import ToolIcon from '@/components/tool-icon';
import { useFavorites } from '@/lib/storage';
import { LanguageEnum, useI18n } from '@/lib/i18n';
import type { ToolMeta } from '@/tools/types';
import { DocTabEnum } from './constants';

/**
 * 工具工作台 Shell 组件属性
 */
interface ToolWorkspaceProps {
  /** 当前展示的工具元数据 */
  tool: ToolMeta;
  /** 与当前工具相关的推荐工具集合 */
  relatedTools: ToolMeta[];
  /** 交互工具运行区节点 */
  children: React.ReactNode;
}

/**
 * 工具工作台，承载面包屑、收藏与分享操作、工具简介、交互运行区、文档标签与相关推荐
 *
 * @param props - 组件属性
 * @param props.tool - 当前展示的工具元数据
 * @param props.relatedTools - 与当前工具相关的推荐工具集合
 * @param props.children - 交互工具运行区节点
 * @returns 工作台完整内容节点
 */
function ToolWorkspace({ tool, relatedTools, children }: ToolWorkspaceProps) {
  const { t, language } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeDocTab, setActiveDocTab] = useState<DocTabEnum>(DocTabEnum.INTRO);
  const [shareCopied, setShareCopied] = useState(false);

  const isFavorited = isFavorite(tool.slug);
  const toolName = language === LanguageEnum.EN ? tool.nameEn : tool.name;
  const toolNameAlt = language === LanguageEnum.EN ? tool.name : tool.nameEn;
  const toolDescription =
    language === LanguageEnum.EN ? tool.descriptionEn : tool.description;
  const doc = language === LanguageEnum.EN ? tool.doc.en : tool.doc.zh;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareCopied(false);
    }
  };

  const docTabs = [
    { value: DocTabEnum.INTRO, label: t('workspace.tabIntro') },
    { value: DocTabEnum.HOW_TO, label: t('workspace.tabHowTo') },
    { value: DocTabEnum.PRIVACY, label: t('workspace.tabPrivacy') },
    { value: DocTabEnum.FAQ, label: t('workspace.tabFaq') },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-1 font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('library.backToHub')}</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {tool.tags[0] ?? t('common.clientSideExecution')}
          </span>
          <span>/</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {toolName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-favorite-btn"
            type="button"
            onClick={() => toggleFavorite(tool.slug)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isFavorited
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${
                isFavorited
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span>
              {isFavorited
                ? t('workspace.favorited')
                : t('workspace.favorite')}
            </span>
          </button>

          <button
            id="share-tool-btn"
            type="button"
            onClick={handleShare}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>
              {shareCopied
                ? t('workspace.copiedShare')
                : t('workspace.share')}
            </span>
          </button>

          <div className="hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 sm:flex dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {t('common.clientSideExecution')} · {t('library.zeroUpload')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
          <ToolIcon name={tool.iconName} className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              {toolName}
            </h1>
            <span className="font-mono text-xs font-normal text-slate-400 dark:text-slate-500">
              {toolNameAlt}
            </span>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
            {toolDescription}
          </p>
        </div>
      </div>

      <section id="interactive-tool-workspace" className="w-full">
        {children}
      </section>

      <section
        id="tool-documentation-section"
        className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('workspace.docGuide')}
              </h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t('workspace.docSub')}
            </span>
          </div>

          <div className="flex max-w-md items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
            {docTabs.map((tab) => (
              <button
                key={tab.value}
                id={`doc-tab-${tab.value}`}
                type="button"
                onClick={() => setActiveDocTab(tab.value)}
                className={`flex-1 cursor-pointer rounded-lg py-1.5 font-medium transition-colors ${
                  activeDocTab === tab.value
                    ? 'bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-700 shadow-xs sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {activeDocTab === DocTabEnum.INTRO && (
              <div className="space-y-4">
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  {doc.whatIsIt}
                </p>
                <div>
                  <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                    {t('workspace.coreFeatures')}
                  </h3>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {doc.coreFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ✓
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeDocTab === DocTabEnum.HOW_TO && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                    {t('workspace.standardSteps')}
                  </h3>
                  <ol className="space-y-2">
                    {doc.howToUse.map((step, index) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-2">
                  <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                    {t('workspace.useCases')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doc.useCases.map((useCase) => (
                      <span
                        key={useCase}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeDocTab === DocTabEnum.PRIVACY && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('workspace.privacyStatement')}</span>
                </div>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  {doc.privacyNote}
                </p>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {t('workspace.privacyAdvocate')}
                </div>
              </div>
            )}

            {activeDocTab === DocTabEnum.FAQ && (
              <div className="space-y-3">
                {doc.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="mb-1 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span>{faq.question}</span>
                    </div>
                    <p className="pl-6 text-xs text-slate-600 dark:text-slate-400">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 border-t border-slate-200 pt-6 dark:border-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('workspace.relatedTools')}
            </h2>
          </div>
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <span>{t('hub.viewAllTools')}</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {relatedTools.map((relatedTool) => {
            const relatedName =
              language === LanguageEnum.EN
                ? relatedTool.nameEn
                : relatedTool.name;
            const relatedDescription =
              language === LanguageEnum.EN
                ? relatedTool.descriptionEn
                : relatedTool.description;

            return (
              <Link
                key={relatedTool.slug}
                href={relatedTool.path}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
                    <ToolIcon
                      name={relatedTool.iconName}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {relatedName}
                  </div>
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {relatedDescription}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ToolWorkspace;
