'use client';

import { useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  buildCssVariables,
  buildJsConstants,
  buildScssVariables,
  parseHexToRgb,
  type ColorToken,
} from './utils/naming';

/** 默认令牌集合 */
const DEFAULT_TOKENS: ColorToken[] = [
  { name: 'Primary', value: '#2563EB' },
  { name: 'Primary Hover', value: '#1D4ED8' },
  { name: 'Success', value: '#16A34A' },
  { name: 'Warning', value: '#D97706' },
  { name: 'Danger', value: '#DC2626' },
  { name: 'Text Primary', value: '#0F172A' },
];

/** 输出格式标识 */
type OutputFormat = 'css' | 'js' | 'scss';

/**
 * 命名颜色与 CSS 变量同步器，维护语义化颜色令牌，
 * 一键同步生成 CSS 变量、JS 常量与 SCSS 变量，全部运算在浏览器本地完成
 *
 * @returns 命名颜色与变量同步交互界面
 */
function ColorNamingToken() {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<ColorToken[]>(DEFAULT_TOKENS);
  const [format, setFormat] = useState<OutputFormat>('css');
  const [copied, setCopied] = useState(false);

  const output =
    format === 'css'
      ? buildCssVariables(tokens)
      : format === 'js'
        ? buildJsConstants(tokens)
        : buildScssVariables(tokens);

  /**
   * 更新指定令牌字段
   *
   * @param index - 令牌序号
   * @param patch - 字段变更
   */
  function updateToken(index: number, patch: Partial<ColorToken>) {
    setTokens((current) =>
      current.map((token, tokenIndex) =>
        tokenIndex === index ? { ...token, ...patch } : token,
      ),
    );
  }

  /**
   * 删除指定令牌
   *
   * @param index - 令牌序号
   */
  function removeToken(index: number) {
    setTokens((current) => current.filter((_, i) => i !== index));
  }

  /**
   * 复制当前格式的输出文本
   */
  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const formatOptions: OutputFormat[] = ['css', 'js', 'scss'];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.naming.tokensTitle')}
        </div>
        <div className="flex flex-col">
          {tokens.map((token, index) => {
            const valid = parseHexToRgb(token.value) !== null;
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 dark:border-slate-800"
              >
                <input
                  type="color"
                  value={valid ? token.value : '#000000'}
                  onChange={(event) => updateToken(index, { value: event.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="text"
                  value={token.name}
                  onChange={(event) => updateToken(index, { name: event.target.value })}
                  placeholder={t('tools.naming.namePlaceholder')}
                  spellCheck={false}
                  className="w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <input
                  type="text"
                  value={token.value}
                  onChange={(event) => updateToken(index, { value: event.target.value })}
                  spellCheck={false}
                  className={`w-28 rounded-lg border bg-white px-2.5 py-1.5 font-mono text-xs focus:outline-none dark:bg-slate-800 ${
                    valid
                      ? 'border-slate-200 text-slate-800 focus:border-slate-800 dark:border-slate-700 dark:text-slate-200'
                      : 'border-rose-300 text-rose-600 dark:border-rose-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeToken(index)}
                  className="ml-auto text-slate-400 transition-colors hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            setTokens((current) => [...current, { name: '', value: '#94A3B8' }])
          }
          className="flex items-center justify-center gap-1.5 border-t border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
          <Plus className="h-4 w-4" />
          {t('tools.naming.addToken')}
        </button>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {formatOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={
                  format === option
                    ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-3 py-1 font-medium uppercase text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-700" />
                {t('common.copySuccess')}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {t('common.copy')}
              </>
            )}
          </button>
        </div>
        <pre className="max-h-80 overflow-auto bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
          {output}
        </pre>
      </div>
    </div>
  );
}

export default ColorNamingToken;
