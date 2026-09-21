'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import FileDropzone from './components/file-dropzone';
import {
  CodecDirectionEnum,
  CodecDirectionLabelKeyMap,
  CodecModeEnum,
  CodecModeLabelKeyMap,
  DEFAULT_INPUT,
} from './constants';
import { runCodec } from './utils/codec';

/**
 * Base64 / URL / HEX 编解码工具页，输入即时转换为结果，
 * 全部运算在浏览器本地完成，同时支持文件转 Base64 DataURI
 *
 * @returns 编解码工具交互界面
 */
function Base64Codec() {
  const { t } = useI18n();
  const [mode, setMode] = useState<CodecModeEnum>(CodecModeEnum.BASE64);
  const [direction, setDirection] = useState<CodecDirectionEnum>(
    CodecDirectionEnum.ENCODE,
  );
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const result = runCodec(input, mode, direction);
    setOutput(result.output);
    setErrorMessage(result.success ? null : result.errorMessage ?? null);
  }, [input, mode, direction]);

  /**
   * 复制转换结果到剪贴板，并在两秒后恢复按钮状态
   */
  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(t('common.copyFailed'));
    }
  }

  /**
   * 将输出内容回填到输入区并翻转编码方向，便于往返验证
   */
  function handleSwap() {
    if (!output || errorMessage) return;
    setInput(output);
    setDirection(
      direction === CodecDirectionEnum.ENCODE
        ? CodecDirectionEnum.DECODE
        : CodecDirectionEnum.ENCODE,
    );
  }

  /**
   * 清空输入、输出与错误状态
   */
  function handleClear() {
    setInput('');
    setOutput('');
    setErrorMessage(null);
  }

  const modeOptions = Object.values(CodecModeEnum);
  const directionOptions = Object.values(CodecDirectionEnum);
  const isEncode = direction === CodecDirectionEnum.ENCODE;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {modeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={
                  mode === option
                    ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {t(CodecModeLabelKeyMap[option])}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {directionOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDirection(option)}
                className={
                  direction === option
                    ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {t(CodecDirectionLabelKeyMap[mode][option])}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!output || Boolean(errorMessage)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            ⇄ {t('tools.base64.swap')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span>
              {t('tools.base64.inputLabel')}（
              {t(isEncode ? 'tools.base64.sourceEncodeTag' : 'tools.base64.sourceDecodeTag')}）
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {t('tools.base64.charCount', { count: input.length })}
            </span>
          </div>
          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <FileDropzone onDataUri={setInput} />
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('tools.base64.sourcePlaceholder')}
            spellCheck={false}
            className="min-h-[260px] w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600 sm:text-sm"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('tools.base64.outputLabel')}（
              {t(isEncode ? 'tools.base64.outputEncodeTag' : 'tools.base64.outputDecodeTag')}）
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('common.copySuccess')}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  {t('common.copy')}
                </>
              )}
            </button>
          </div>

          <div className="min-h-[300px] flex-1 overflow-auto whitespace-pre-wrap break-all bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950 sm:text-sm">
            {errorMessage ? (
              <div className="text-rose-400">
                <div className="mb-1 font-bold">
                  {t('tools.base64.decodeFailed')}：
                </div>
                <div>{errorMessage}</div>
              </div>
            ) : output ? (
              output
            ) : (
              <span className="text-slate-500">
                {t('tools.base64.waitingInput')}
              </span>
            )}
          </div>
          <div className="flex justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              {t('tools.base64.outputLength')}：{output.length}
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {t('tools.base64.utf8Notice')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Base64Codec;
