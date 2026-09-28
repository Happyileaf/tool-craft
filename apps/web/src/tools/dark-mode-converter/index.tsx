'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_TOKENS,
  convertToDark,
  type DarkStrategy,
  type SemanticToken,
} from './utils/dark-mode';

/** 可选深色转换策略 */
const STRATEGY_OPTIONS: DarkStrategy[] = ['invert', 'soft', 'vivid'];

/**
 * 深色模式配色转换器，批量将浅色主题语义令牌转换为深色对应色，
 * 保持色相稳定并提供三种明暗与饱和度策略，全部运算在浏览器本地完成
 *
 * @returns 深色模式配色转换交互界面
 */
function DarkModeConverter() {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<SemanticToken[]>(DEFAULT_TOKENS);
  const [strategy, setStrategy] = useState<DarkStrategy>('invert');
  const [copied, setCopied] = useState(false);

  const rows = useMemo(
    () =>
      tokens.map((token) => ({
        name: token.name,
        light: token.light,
        dark: convertToDark(token.light, strategy) ?? token.light,
      })),
    [tokens, strategy],
  );

  const cssVariables = useMemo(() => {
    const lightLines = rows
      .map((row) => `  --${row.name}: ${row.light};`)
      .join('\n');
    const darkLines = rows
      .map((row) => `  --${row.name}: ${row.dark};`)
      .join('\n');
    return `:root {\n${lightLines}\n}\n\n.dark {\n${darkLines}\n}`;
  }, [rows]);

  /**
   * 更新指定令牌的浅色颜色
   *
   * @param name - 令牌名称
   * @param color - 新的颜色值
   */
  function updateToken(name: string, color: string) {
    setTokens((current) =>
      current.map((token) =>
        token.name === name ? { ...token, light: color } : token,
      ),
    );
  }

  /**
   * 复制 CSS 变量文本
   */
  async function handleCopyCss() {
    await navigator.clipboard.writeText(cssVariables);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('tools.darkMode.strategy')}
          </span>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {STRATEGY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStrategy(option)}
                className={
                  strategy === option
                    ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {t(`tools.darkMode.strategy_${option}`)}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyCss()}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-700" />
              {t('common.copySuccess')}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t('tools.darkMode.copyCss')}
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{t('tools.darkMode.lightTitle')}</span>
          <span>{t('tools.darkMode.darkTitle')}</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-2 border-b border-slate-100 last:border-0 dark:border-slate-800"
          >
            <label className="flex items-center gap-3 px-4 py-2.5">
              <input
                type="color"
                value={normalizeToHex(row.light)}
                onChange={(event) => updateToken(row.name, event.target.value)}
                className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                {row.light}
              </span>
              <span className="ml-auto truncate text-[10px] text-slate-400">
                {row.name}
              </span>
            </label>
            <div
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ backgroundColor: row.dark }}
            >
              <span
                className="h-7 w-9 rounded border border-white/10"
                style={{ backgroundColor: row.dark }}
              />
              <span className="font-mono text-xs" style={{ color: getSafeText(row.dark) }}>
                {row.dark}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.darkMode.cssTitle')}
        </div>
        <pre className="overflow-auto bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
          {cssVariables}
        </pre>
      </div>
    </div>
  );
}

/**
 * 将任意颜色文本规整为六位 HEX，供原生取色器使用
 *
 * @param color - 颜色文本
 * @returns 六位 HEX；无法解析时回退黑色
 */
function normalizeToHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color.trim())) {
    return color.trim();
  }
  return '#000000';
}

/**
 * 依据 HEX 明度返回适合的文本颜色
 *
 * @param hex - 背景 HEX
 * @returns 白色或深色文本
 */
function getSafeText(hex: string): string {
  const rgb = parseHexSafe(hex);
  if (!rgb) return '#FFFFFF';
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return luminance > 150 ? '#0F172A' : '#FFFFFF';
}

/**
 * 解析六位 HEX 为 RGB
 *
 * @param hex - HEX 颜色
 * @returns RGB 或 null
 */
function parseHexSafe(hex: string) {
  const match = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const value = match[1];
  if (!value) return null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export default DarkModeConverter;
