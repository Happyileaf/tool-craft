'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Shuffle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  buildHarmony,
  formatHslCss,
  formatRgbToHex,
  hslToRgb,
  parseHexToRgb,
  rgbToHsl,
  type HarmonyType,
  type HslColor,
} from './utils/harmony';

/** 默认基准 HEX 颜色 */
const DEFAULT_HEX = '#2563EB';

/** 可选调和方案顺序 */
const HARMONY_OPTIONS: HarmonyType[] = [
  'complementary',
  'analogous',
  'triadic',
  'splitComplementary',
  'tetradic',
  'monochromatic',
];

/**
 * 色彩调和方案生成器，基于色轮旋转规则生成互补色、邻近色、三角色等方案，
 * 实时预览搭配效果并支持复制 HEX 与 CSS，全部运算在浏览器本地完成
 *
 * @returns 色彩调和方案交互界面
 */
function ColorHarmony() {
  const { t } = useI18n();
  const [hexInput, setHexInput] = useState(DEFAULT_HEX);
  const [base, setBase] = useState<HslColor>(() => {
    const rgb = parseHexToRgb(DEFAULT_HEX);
    return rgb ? rgbToHsl(rgb) : { h: 220, s: 80, l: 53 };
  });
  const [type, setType] = useState<HarmonyType>('complementary');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const palette = useMemo(() => buildHarmony(base, type), [base, type]);
  const previewHex = useMemo(
    () => formatRgbToHex(hslToRgb(base)),
    [base],
  );

  /**
   * 从 HEX 文本框同步基准色
   */
  function syncFromHex() {
    const rgb = parseHexToRgb(hexInput);
    if (rgb) {
      setBase(rgbToHsl(rgb));
    }
  }

  /**
   * 随机生成基准色
   */
  function randomize() {
    const hsl: HslColor = {
      h: Math.floor(Math.random() * 360),
      s: 65 + Math.floor(Math.random() * 25),
      l: 45 + Math.floor(Math.random() * 20),
    };
    setBase(hsl);
    setHexInput(formatRgbToHex(hslToRgb(hsl)));
  }

  /**
   * 复制配色中的某一颜色
   *
   * @param hex - 待复制 HEX
   * @param index - 颜色序号
   */
  async function handleCopy(hex: string, index: number) {
    await navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1500);
  }

  /**
   * 复制整套配色的 HEX 列表
   */
  async function handleCopyAll() {
    const text = palette
      .map((hsl) => formatRgbToHex(hslToRgb(hsl)))
      .join(', ');
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={previewHex}
            onChange={(event) => {
              setHexInput(event.target.value);
              const rgb = parseHexToRgb(event.target.value);
              if (rgb) setBase(rgbToHsl(rgb));
            }}
            className="h-9 w-11 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value)}
            onBlur={syncFromHex}
            onKeyDown={(event) => {
              if (event.key === 'Enter') syncFromHex();
            }}
            spellCheck={false}
            className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyAll()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Copy className="h-3.5 w-3.5" />
            {t('tools.harmony.copyAll')}
          </button>
          <button
            type="button"
            onClick={randomize}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Shuffle className="h-3.5 w-3.5 text-rose-500" />
            {t('tools.harmony.random')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {HARMONY_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={
              type === option
                ? 'rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }
          >
            {t(`tools.harmony.type_${option}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.harmony.previewTitle')}
        </div>
        <div className="flex h-40">
          {palette.map((hsl, index) => {
            const hex = formatRgbToHex(hslToRgb(hsl));
            return (
              <button
                key={`${hex}-${index}`}
                type="button"
                onClick={() => void handleCopy(hex, index)}
                className="flex flex-1 flex-col items-center justify-end gap-1 pb-4 transition-all hover:flex-[1.4]"
                style={{ backgroundColor: hex }}
              >
                <span
                  className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100"
                  style={{ opacity: copiedIndex === index ? 1 : undefined }}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    hex
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {palette.map((hsl, index) => {
          const rgb = hslToRgb(hsl);
          const hex = formatRgbToHex(rgb);
          return (
            <div
              key={`detail-${hex}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <span
                className="h-12 w-12 shrink-0 rounded-lg shadow-xs"
                style={{ backgroundColor: hex }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  {hex}
                </span>
                <span className="truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  {formatHslCss(hsl)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy(hex, index)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ColorHarmony;
