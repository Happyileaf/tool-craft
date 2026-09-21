'use client';

import { useMemo, useState } from 'react';
import {
  Bold,
  Check,
  Code,
  Code2,
  Columns,
  Copy,
  Eye,
  Heading2,
  List,
  Monitor,
  Smartphone,
  TextQuote,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_MARKDOWN,
  MarkdownModeEnum,
  MarkdownModeLabelKeyMap,
  MarkdownModeOptions,
  MarkdownSnippetEnum,
  MarkdownSnippetOptions,
  MarkdownThemeEnum,
  MarkdownThemeLabelKeyMap,
  MarkdownThemeOptions,
} from './constants';
import { buildSnippet, renderMarkdown } from './utils/markdown';

/** 复制后按钮上展示的状态标识，区分源码、富文本与 HTML */
type CopiedKind = 'source' | 'rich' | 'html';

/** 模式枚举对应的分段控件图标 */
const MODE_ICON_MAP: Record<MarkdownModeEnum, typeof Eye> = {
  [MarkdownModeEnum.EDIT]: Code2,
  [MarkdownModeEnum.SPLIT]: Columns,
  [MarkdownModeEnum.PREVIEW]: Eye,
};

/** 主题枚举对应的切换控件图标 */
const THEME_ICON_MAP: Record<MarkdownThemeEnum, typeof Monitor> = {
  [MarkdownThemeEnum.DEFAULT]: Monitor,
  [MarkdownThemeEnum.WECHAT]: Smartphone,
};

/** 快捷插入片段枚举对应的按钮图标 */
const SNIPPET_ICON_MAP: Record<MarkdownSnippetEnum, typeof Heading2> = {
  [MarkdownSnippetEnum.H2]: Heading2,
  [MarkdownSnippetEnum.Bold]: Bold,
  [MarkdownSnippetEnum.List]: List,
  [MarkdownSnippetEnum.Quote]: TextQuote,
  [MarkdownSnippetEnum.CodeBlock]: Code,
};

/** 标准主题下手写的等价 prose 排版类名，覆盖全部渲染标签 */
const DEFAULT_PROSE_CLASS = [
  'text-sm leading-7 text-slate-700 dark:text-slate-300',
  '[&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-slate-200 [&_h1]:pb-2 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 dark:[&_h1]:border-slate-800 dark:[&_h1]:text-white',
  '[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:border-slate-800 dark:[&_h2]:text-white',
  '[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white',
  '[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-slate-900 dark:[&_h4]:text-slate-100',
  '[&_p]:my-3 [&_p]:leading-7',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1 [&_li]:pl-1 [&_li]:marker:text-slate-400 dark:[&_li]:marker:text-slate-500',
  '[&_code]:rounded [&_code]:bg-rose-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-rose-600 dark:[&_code]:bg-slate-800 dark:[&_code]:text-rose-400',
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-800 [&_pre]:bg-slate-900 [&_pre]:p-4 dark:[&_pre]:border-slate-800 dark:[&_pre]:bg-slate-950',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-emerald-400 dark:[&_pre_code]:bg-transparent dark:[&_pre_code]:text-emerald-400',
  '[&_blockquote]:my-4 [&_blockquote]:rounded-r [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:bg-slate-50 [&_blockquote]:py-1 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:bg-slate-800/60 dark:[&_blockquote]:text-slate-300',
  '[&_blockquote_p]:my-1.5',
  '[&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-blue-400',
  '[&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800',
].join(' ');

/** 微信公众号风格排版类名，限宽手机视图配合 16px 正文与宽段落间距 */
const WECHAT_PROSE_CLASS = [
  'mx-auto w-full max-w-[375px] text-[16px] leading-[1.75] text-[#3f3f3f]',
  '[&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-center [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:leading-snug [&_h1]:text-[#1a1a1a]',
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-[#1a1a1a]',
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-[#1a1a1a]',
  '[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-[16px] [&_h4]:font-semibold [&_h4]:text-[#1a1a1a]',
  '[&_p]:mb-[22px] [&_p]:mt-0 [&_p]:text-justify',
  '[&_ul]:mb-[22px] [&_ul]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-[22px] [&_ol]:mt-0 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1.5 [&_li]:marker:text-[#576b95]',
  '[&_code]:rounded [&_code]:bg-[#f3f4f6] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[14px] [&_code]:text-[#d14836]',
  '[&_pre]:mb-[22px] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#282c34] [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#abb2bf]',
  '[&_blockquote]:mb-[22px] [&_blockquote]:rounded-r [&_blockquote]:border-l-4 [&_blockquote]:border-[#576b95] [&_blockquote]:bg-[#f7f8fa] [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:text-[#6b7280]',
  '[&_blockquote_p]:my-1 [&_blockquote_p]:text-justify',
  '[&_a]:text-[#576b95] [&_a]:underline [&_a]:underline-offset-2',
  '[&_hr]:mb-[22px] [&_hr]:mt-2 [&_hr]:border-slate-200',
].join(' ');

/**
 * Markdown 在线预览与排版工具页，左侧编辑源码、右侧实时渲染，
 * 支持编辑/分屏/预览三种视图、标准/微信两种主题，以及富文本与 HTML 复制
 *
 * @returns Markdown 预览工具交互界面
 */
function MarkdownPreview() {
  const { t } = useI18n();
  const [text, setText] = useState(DEFAULT_MARKDOWN);
  const [mode, setMode] = useState<MarkdownModeEnum>(MarkdownModeEnum.SPLIT);
  const [theme, setTheme] = useState<MarkdownThemeEnum>(
    MarkdownThemeEnum.DEFAULT,
  );
  const [copiedKind, setCopiedKind] = useState<CopiedKind | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  const html = useMemo(() => renderMarkdown(text), [text]);

  const stats = useMemo(() => {
    /** 中日韩等表意文字按单个字符计一字，拉丁字母按空白分词计一词 */
    const cjkChars = (text.match(/[㐀-䶿一-鿿豈-﫿぀-ヿ가-힯]/g) ?? [])
      .length;
    const latinWords = (text.match(/[a-z0-9]+(?:['-][a-z0-9]+)*/gi) ?? [])
      .length;
    const words = cjkChars + latinWords;
    const readingTime = Math.max(1, Math.ceil(words / 300));
    return { words, chars: text.length, readingTime };
  }, [text]);

  /**
   * 复制操作完成后短暂展示成功态，并复位失败提示
   *
   * @param kind - 本次复制的类型，用于决定按钮上的成功标识
   */
  function showCopied(kind: CopiedKind) {
    setCopyFailed(false);
    setCopiedKind(kind);
    window.setTimeout(() => setCopiedKind(null), 2000);
  }

  /**
   * 将渲染后的 HTML 以 text/html 写入剪贴板，粘贴到公众号后台、邮件或文档时保留排版；
   * 不支持 ClipboardItem 富文本的环境回退为写入纯文本源码
   */
  async function handleCopyRichText() {
    try {
      if (typeof ClipboardItem === 'function' && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      showCopied('rich');
    } catch {
      setCopyFailed(true);
    }
  }

  /**
   * 复制渲染后的 HTML 源码，便于粘贴到代码或 CMS 模板中
   */
  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      showCopied('html');
    } catch {
      setCopyFailed(true);
    }
  }

  /**
   * 复制原始 Markdown 源码，便于粘贴到支持 Markdown 的编辑器
   */
  async function handleCopySource() {
    try {
      await navigator.clipboard.writeText(text);
      showCopied('source');
    } catch {
      setCopyFailed(true);
    }
  }

  /**
   * 将所选语法片段追加到源码末尾，占位文本随当前语言切换
   *
   * @param snippet - 快捷插入片段枚举
   */
  function handleInsertSnippet(snippet: MarkdownSnippetEnum) {
    const snippetText = buildSnippet(
      snippet,
      t('tools.markdown.sampleText'),
      t('tools.markdown.codeSampleText'),
    );
    setText((prev) => prev + snippetText);
  }

  /**
   * 清空全部源码并重置复制状态
   */
  function handleClear() {
    setText('');
    setCopiedKind(null);
    setCopyFailed(false);
  }

  const showEditor = mode === MarkdownModeEnum.EDIT || mode === MarkdownModeEnum.SPLIT;
  const showPreview = mode === MarkdownModeEnum.PREVIEW || mode === MarkdownModeEnum.SPLIT;
  const isWechat = theme === MarkdownThemeEnum.WECHAT;
  const proseClass = isWechat ? WECHAT_PROSE_CLASS : DEFAULT_PROSE_CLASS;

  /**
   * 渲染复制按钮内容，复制成功时切换为对勾与成功文案
   *
   * @param kind - 按钮对应的复制类型
   * @param labelKey - 正常状态下的文案键
   * @returns 按钮内部节点
   */
  function renderCopyButtonContent(kind: CopiedKind, labelKey: string) {
    if (copiedKind === kind) {
      return (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400">
            {t('common.copySuccess')}
          </span>
        </>
      );
    }
    return (
      <>
        <Copy className="h-3.5 w-3.5" />
        {t(labelKey)}
      </>
    );
  }

  const editorPane = (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
        <span>{t('tools.markdown.editorTitle')}</span>
        <span className="font-mono text-slate-400 dark:text-slate-500">
          {t('tools.base64.charCount', { count: stats.chars })}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t('tools.markdown.placeholder')}
        spellCheck={false}
        className="min-h-[420px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600 sm:text-sm"
      />
    </div>
  );

  const previewPane = (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
        <span>{t('tools.markdown.previewTitle')}</span>
        <span className="text-slate-400 dark:text-slate-500">
          {t(MarkdownThemeLabelKeyMap[theme])}
        </span>
      </div>
      <div
        className={
          isWechat
            ? 'min-h-[420px] flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-slate-950/60'
            : 'min-h-[420px] flex-1 overflow-y-auto bg-slate-50/30 p-5 dark:bg-slate-950/30'
        }
      >
        {text.trim() ? (
          <div className={proseClass} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="flex h-full min-h-[380px] items-center justify-center text-sm text-slate-400 dark:text-slate-600">
            {t('tools.base64.waitingInput')}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {MarkdownModeOptions.map((option) => {
              const ModeIcon = MODE_ICON_MAP[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={
                    mode === option.value
                      ? 'flex items-center gap-1 rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'flex items-center gap-1 rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }
                >
                  <ModeIcon className="h-3.5 w-3.5" />
                  {t(MarkdownModeLabelKeyMap[option.value])}
                </button>
              );
            })}
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {MarkdownThemeOptions.map((option) => {
              const ThemeIcon = THEME_ICON_MAP[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={
                    theme === option.value
                      ? 'flex items-center gap-1 rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'flex items-center gap-1 rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }
                >
                  <ThemeIcon className="h-3.5 w-3.5" />
                  {t(option.label)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyRichText}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {renderCopyButtonContent('rich', 'tools.markdown.copyRichText')}
          </button>
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {renderCopyButtonContent('html', 'tools.markdown.copyHtml')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('tools.markdown.quickInsert')}
          </span>
          {MarkdownSnippetOptions.map((option) => {
            const SnippetIcon = SNIPPET_ICON_MAP[option.value];
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInsertSnippet(option.value)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                <SnippetIcon className="h-3.5 w-3.5" />
                {t(option.label)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCopySource}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {renderCopyButtonContent('source', 'tools.markdown.copySource')}
        </button>
      </div>

      {copyFailed ? (
        <div className="text-xs text-rose-600 dark:text-rose-400">
          {t('common.copyFailed')}
        </div>
      ) : null}

      <div
        className={
          showEditor && showPreview
            ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
            : 'grid grid-cols-1 gap-4'
        }
      >
        {showEditor ? editorPane : null}
        {showPreview ? previewPane : null}
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500">
        {t('tools.markdown.wordCount', {
          words: stats.words,
          chars: stats.chars,
          time: stats.readingTime,
        })}
      </div>
    </div>
  );
}

export default MarkdownPreview;
