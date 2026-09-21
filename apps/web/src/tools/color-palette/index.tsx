'use client';

import { useState } from 'react';
import { Palette, Shuffle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_HEX, PRESET_COLORS, WCAG_AA_LARGE, WCAG_AA_NORMAL } from './constants';
import {
  buildShades,
  createRandomRgb,
  formatRgbToHex,
  getContrastRatio,
  parseHexToRgb,
  type RgbColor,
} from './utils/color';

/**
 * 拾色器与色阶工具页，基于基准主色生成十级 Tailwind 风格色阶，
 * 并按 WCAG 2.1 规范检验其与白色、深色背景的对比度
 *
 * @returns 配色与对比度检验界面
 */
function ColorPalette() {
  const { t } = useI18n();
  const [hexInput, setHexInput] = useState(DEFAULT_HEX);
  const [copiedLevel, setCopiedLevel] = useState<string | null>(null);

  const rgb = parseHexToRgb(hexInput);
  const isValid = rgb !== null;
  const safeRgb: RgbColor = rgb ?? { r: 37, g: 99, b: 235 };
  const shades = buildShades(safeRgb);
  const whiteContrast = getContrastRatio(safeRgb, { r: 255, g: 255, b: 255 });
  const darkContrast = getContrastRatio(safeRgb, { r: 15, g: 23, b: 42 });

  /**
   * 复制某一档色阶的 HEX 值，并在 1.5 秒后恢复提示
   *
   * @param hex - 待复制的 HEX 颜色值
   * @param level - 对应的色阶档位
   */
  async function handleCopyShade(hex: string, level: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedLevel(level);
      window.setTimeout(() => setCopiedLevel(null), 1500);
    } catch {
      setCopiedLevel(null);
    }
  }

  /**
   * 生成一个随机主色并写入输入框
   */
  function handleRandomColor() {
    setHexInput(formatRgbToHex(createRandomRgb()));
  }

  /**
   * 渲染单个对比度阈值的达标状态标签
   *
   * @param ratio - 当前对比度
   * @param threshold - 达标所需阈值
   * @returns 带达标样式的状态元素
   */
  function renderPassTag(ratio: number, threshold: number) {
    const passed = ratio >= threshold;
    return (
      <span
        className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
          passed
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
        }`}
      >
        {passed ? t('tools.color.aaPass') : t('tools.color.notPass')}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValid ? hexInput.toUpperCase() : DEFAULT_HEX}
            onChange={(event) => setHexInput(event.target.value.toUpperCase())}
            className="h-12 w-12 cursor-pointer rounded-lg border-2 border-white shadow-sm dark:border-slate-700"
          />
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('tools.color.baseColorHex')}
            </div>
            <div className="relative">
              <input
                type="text"
                value={hexInput}
                onChange={(event) => setHexInput(event.target.value.toUpperCase())}
                maxLength={7}
                spellCheck={false}
                className="w-28 rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-base font-bold uppercase text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
              />
              {!isValid && (
                <span className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] font-medium text-rose-500">
                  {t('tools.color.invalidHex')}
                </span>
              )}
            </div>
          </div>

          <div className="hidden flex-col border-l border-slate-200 pl-3 font-mono text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex">
            <span>
              {t('tools.color.rgbValue', {
                r: safeRgb.r,
                g: safeRgb.g,
                b: safeRgb.b,
              })}
            </span>
            <span>{t('tools.color.cssVariable')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleRandomColor}
            className="mr-1 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Shuffle className="h-3 w-3" />
            {t('tools.color.randomPalette')}
          </button>
          <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">
            {t('tools.color.presetPalette')}
          </span>
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setHexInput(color)}
              title={color}
              className="h-6 w-6 cursor-pointer rounded-md border border-white shadow-2xs transition-transform hover:scale-110 dark:border-slate-700"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('tools.color.whiteBgTest')}
              </div>
              <div className="mt-0.5 font-mono text-2xl font-black text-slate-900 dark:text-white">
                {whiteContrast.toFixed(2)} : 1
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-1.5 font-mono text-xs font-bold shadow-xs"
              style={{ backgroundColor: hexInput.toUpperCase(), color: '#FFFFFF' }}
            >
              {t('tools.color.sampleOnWhite')}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                {t('tools.color.normalText')}
              </span>
              {renderPassTag(whiteContrast, WCAG_AA_NORMAL)}
            </div>
            <div className="flex items-center justify-between rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                {t('tools.color.largeText')}
              </span>
              {renderPassTag(whiteContrast, WCAG_AA_LARGE)}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('tools.color.darkBgTest')}
              </div>
              <div className="mt-0.5 font-mono text-2xl font-black text-slate-900 dark:text-white">
                {darkContrast.toFixed(2)} : 1
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold shadow-xs">
              <span style={{ color: hexInput.toUpperCase() }}>
                {t('tools.color.sampleOnDark')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                {t('tools.color.normalText')}
              </span>
              {renderPassTag(darkContrast, WCAG_AA_NORMAL)}
            </div>
            <div className="flex items-center justify-between rounded bg-slate-50 p-2 dark:bg-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                {t('tools.color.largeText')}
              </span>
              {renderPassTag(darkContrast, WCAG_AA_LARGE)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('tools.color.shadesTitle')}
            </span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t('tools.color.clickToCopyHint')}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {shades.map((shade) => (
            <button
              key={shade.level}
              type="button"
              onClick={() => handleCopyShade(shade.hex, shade.level)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 text-left transition-transform hover:-translate-y-0.5 dark:border-slate-800"
            >
              <div
                className="flex h-14 w-full items-end justify-center pb-1 font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: shade.hex,
                  color: Number(shade.level) >= 500 ? '#FFFFFF' : '#0F172A',
                }}
              >
                {copiedLevel === shade.level
                  ? t('tools.color.copied')
                  : shade.level}
              </div>
              <div className="w-full bg-white p-1.5 text-center dark:bg-slate-800">
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {shade.hex}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ColorPalette;
