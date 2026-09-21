'use client';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  JSON_SAMPLE_TEXT,
  JsonIndentEnum,
  JsonIndentOptions,
  JsonIndentSpaceMap,
} from './constants';
import {
  getJsonStats,
  processJson,
  repairJsonText,
} from './utils/json';

/** 1024 字节换算阈值，体积小于该值时以 B 展示，否则换算为 KB */
const KILOBYTE_THRESHOLD = 1024;

/**
 * JSON 格式化工具页，顶部控制缩进与排序，左侧采集输入，右侧实时呈现结果，
 * 全部解析与排版均在浏览器本地完成，不发送任何网络请求
 *
 * @returns JSON 格式化工具交互界面
 */
function JsonFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [indentMode, setIndentMode] = useState<JsonIndentEnum>(
    JsonIndentEnum.TwoSpace,
  );
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      processJson(
        input,
        JsonIndentSpaceMap[indentMode],
        sortKeys,
      ),
    [input, indentMode, sortKeys],
  );

  const output = result.success ? (result.output ?? '') : '';
  const errorMessage = result.success ? null : result.errorMessage ?? null;
  const stats = useMemo(
    () => (output ? getJsonStats(output) : null),
    [output],
  );

  /**
   * 复制格式化结果到剪贴板，成功后短暂展示已复制反馈
   */
  async function handleCopy() {
    if (!output) {
      return;
    }
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /**
   * 将格式化结果以 formatted.json 文件名下载到本地
   */
  function handleDownload() {
    if (!output) {
      return;
    }
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'formatted.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 载入内置示例并切换回两空格缩进
   */
  function handleLoadSample() {
    setInput(JSON_SAMPLE_TEXT);
    setIndentMode(JsonIndentEnum.TwoSpace);
  }

  /**
   * 清空输入并重置排序与复制反馈
   */
  function handleClear() {
    setInput('');
    setSortKeys(false);
    setCopied(false);
  }

  /**
   * 对输入执行单引号与未加引号键名的字面修复
   */
  function handleRepair() {
    setInput((current) => repairJsonText(current));
  }

  /**
   * 依据字节体积格式化为 B 或 KB 展示文本
   *
   * @param bytes - UTF-8 字节数
   * @returns 带单位的体积文案
   */
  function formatByteSize(bytes: number) {
    if (bytes < KILOBYTE_THRESHOLD) {
      return `${bytes} B`;
    }
    return `${(bytes / KILOBYTE_THRESHOLD).toFixed(1)} KB`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="px-1 font-medium text-slate-500 dark:text-slate-400">
            {t('tools.json.indentLabel')}
          </span>
          {JsonIndentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setIndentMode(option.value)}
              className={cnIndentButton(indentMode === option.value)}
            >
              {t(`tools.json.indent${option.value}`)}
            </button>
          ))}
          <label className="ml-2 flex cursor-pointer select-none items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(event) => setSortKeys(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span>{t('tools.json.sortKeys')}</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{t('tools.json.loadSample')}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('tools.json.clear')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span>{t('tools.json.inputTitle')}</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">
              {t('tools.json.inputHint')}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('tools.json.placeholder')}
            spellCheck={false}
            className="min-h-[360px] w-full flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600 sm:text-sm"
          />
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-850/50 dark:text-slate-400">
            <span>
              {t('tools.json.inputCount', { count: input.length })}
            </span>
            <button
              type="button"
              onClick={handleRepair}
              className="cursor-pointer text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {t('tools.json.repair')}
            </button>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium dark:border-slate-800">
            <div className="flex items-center gap-2">
              {errorMessage ? (
                <>
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">
                    {t('tools.json.syntaxError')}
                  </span>
                </>
              ) : output ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {t('tools.json.formatSuccess')}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('tools.json.waiting')}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t('tools.json.copied')}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{t('tools.json.copyResult')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t('tools.json.download')}</span>
              </button>
            </div>
          </div>

          <div className="min-h-[360px] flex-1 overflow-auto bg-slate-900 dark:bg-slate-950">
            {errorMessage ? (
              <div className="whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-rose-400 sm:text-sm">
                <div className="mb-2 font-bold">
                  {t('tools.json.errorTitle')}
                </div>
                <div className="mb-4 rounded border border-rose-800/60 bg-rose-950/50 p-3 text-rose-300">
                  {errorMessage}
                </div>
                <div className="text-xs text-slate-400">
                  {t('tools.json.errorTip')}
                </div>
              </div>
            ) : output ? (
              <pre className="whitespace-pre p-4 font-mono text-xs leading-relaxed text-emerald-400 selection:bg-emerald-900 selection:text-white sm:text-sm">
                {output}
              </pre>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-xs text-slate-500">
                <p>{t('tools.json.emptyResult')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                {t('tools.json.statsLines')}:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {stats?.lines ?? 0}
                </strong>
              </span>
              <span>
                {t('tools.json.statsChars')}:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {stats?.chars ?? 0}
                </strong>
              </span>
              <span>
                {t('tools.json.statsBytes')}:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {stats ? formatByteSize(stats.bytes) : '0 B'}
                </strong>
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('tools.json.localNotice')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 生成缩进按钮在选中与未选中两种状态下的样式类名
 *
 * @param isActive - 当前缩进模式是否为该按钮对应模式
 * @returns 拼接完成的 Tailwind 类名
 */
function cnIndentButton(isActive: boolean): string {
  const base =
    'px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer';
  return isActive
    ? `${base} bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900`
    : `${base} bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700`;
}

export default JsonFormatter;
