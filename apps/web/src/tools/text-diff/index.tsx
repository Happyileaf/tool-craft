'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, Copy, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  CONTRACT_TEXT_A,
  CONTRACT_TEXT_B,
  DEFAULT_TEXT_A,
  DEFAULT_TEXT_B,
  TextDiffModeEnum,
  TextDiffModeOptions,
} from './constants';
import { computeLineDiff, type DiffResult } from './utils/diff';

/**
 * 文本对比工具页，基于 LCS 动态规划提供真实行级差异，
 * 支持左右分栏与上下堆叠两种输入布局，全部运算在浏览器本地完成
 *
 * @returns 文本对比工具交互界面
 */
function TextDiff() {
  const { t } = useI18n();
  const [mode, setMode] = useState<TextDiffModeEnum>(TextDiffModeEnum.SPLIT);
  const [textA, setTextA] = useState(DEFAULT_TEXT_A);
  const [textB, setTextB] = useState(DEFAULT_TEXT_B);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'a' | 'b' | null>(null);

  const diffResult: DiffResult = useMemo(
    () => computeLineDiff(textA, textB, ignoreWhitespace),
    [textA, textB, ignoreWhitespace],
  );

  /**
   * 复制指定面板的文本到剪贴板，并在两秒内展示复制成功状态
   *
   * @param text - 待复制的文本内容
   * @param panelKey - 触发复制的面板标识，a 为原版、b 为新版
   */
  async function handleCopy(text: string, panelKey: 'a' | 'b') {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(panelKey);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  }

  /**
   * 载入中文合同条款样例到两侧输入面板
   */
  function handleLoadContract() {
    setTextA(CONTRACT_TEXT_A);
    setTextB(CONTRACT_TEXT_B);
  }

  /**
   * 清空两侧输入面板的全部内容
   */
  function handleClear() {
    setTextA('');
    setTextB('');
  }

  /**
   * 渲染单侧文本输入面板，包含彩色状态点、复制按钮、多行输入框与行数字符统计
   *
   * @param panelKey - 面板标识，a 为红点原版、b 为绿点新版
   * @param value - 当前面板的文本内容
   * @param setValue - 当前面板文本内容的更新方法
   * @returns 单侧文本输入面板节点
   */
  function renderTextPanel(
    panelKey: 'a' | 'b',
    value: string,
    setValue: Dispatch<SetStateAction<string>>,
  ) {
    const isPanelA = panelKey === 'a';
    const lineCount = value.split('\n').length;

    return (
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span
              className={
                isPanelA
                  ? 'h-2.5 w-2.5 rounded-full bg-rose-400'
                  : 'h-2.5 w-2.5 rounded-full bg-emerald-400'
              }
            />
            <span>
              {isPanelA
                ? t('tools.diff.originalTitle')
                : t('tools.diff.modifiedTitle')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(value, panelKey)}
            className="flex cursor-pointer items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {copiedKey === panelKey ? (
              <>
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('common.copySuccess')}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>
                  {isPanelA
                    ? t('tools.diff.copyA')
                    : t('tools.diff.copyB')}
                </span>
              </>
            )}
          </button>
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            isPanelA
              ? t('tools.diff.placeholderA')
              : t('tools.diff.placeholderB')
          }
          spellCheck={false}
          className="min-h-[320px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600 sm:text-sm"
        />
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
          {t('tools.diff.lineCharCount', {
            lines: lineCount,
            chars: value.length,
          })}
        </div>
      </div>
    );
  }

  /**
   * 渲染底部合并差异视图，按行级 diff 结果着色并正确展示新增与删除行
   *
   * @returns 合并差异视图节点
   */
  function renderUnifiedDiff() {
    const hasContent = diffResult.lines.length > 0;

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{t('tools.diff.unifiedTitle')}</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('tools.diff.legend')}
          </span>
        </div>
        <div className="max-h-[360px] overflow-x-auto bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-200 dark:bg-slate-950 sm:text-sm">
          {hasContent ? (
            diffResult.lines.map((line, index) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';
              const lineNumber = isRemoved
                ? line.oldLineNumber
                : line.newLineNumber;

              return (
                <div
                  key={`${line.type}-${index}`}
                  className={
                    isAdded
                      ? 'flex items-start gap-3 rounded border-l-2 border-emerald-500 bg-emerald-950/80 px-2 py-0.5 text-emerald-300'
                      : isRemoved
                        ? 'flex items-start gap-3 rounded border-l-2 border-rose-500 bg-rose-950/80 px-2 py-0.5 text-rose-300'
                        : 'flex items-start gap-3 rounded px-2 py-0.5 text-slate-300 dark:text-slate-400'
                  }
                >
                  <span className="w-8 shrink-0 select-none text-right text-slate-500">
                    {lineNumber}
                  </span>
                  <span className="shrink-0 select-none text-slate-500">
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </span>
                  <span className="break-all">{line.text || ' '}</span>
                </div>
              );
            })
          ) : (
            <span className="text-slate-500 dark:text-slate-600">
              {t('tools.diff.emptyHint')}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {TextDiffModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={
                  mode === option.value
                    ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {t(option.label)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              {t('tools.diff.statAdded', { count: diffResult.addedCount })}
            </span>
            <span className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
              {t('tools.diff.statRemoved', {
                count: diffResult.removedCount,
              })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('tools.diff.similarity', { value: diffResult.similarity })}
            </span>
          </div>

          <label className="ml-1 flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(event) => setIgnoreWhitespace(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span>{t('tools.diff.trimWhitespace')}</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadContract}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{t('tools.diff.loadContract')}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('tools.diff.clearContent')}</span>
          </button>
        </div>
      </div>

      {mode === TextDiffModeEnum.SPLIT ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderTextPanel('a', textA, setTextA)}
          {renderTextPanel('b', textB, setTextB)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {renderTextPanel('a', textA, setTextA)}
          {renderTextPanel('b', textB, setTextB)}
        </div>
      )}

      {renderUnifiedDiff()}
    </div>
  );
}

export default TextDiff;
