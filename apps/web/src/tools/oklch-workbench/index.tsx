'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Shuffle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  buildOklchShades,
  formatOklchCss,
  oklchToRgb,
  parseHexToRgb,
  rgbToOklch,
  formatRgbToHex,
  type OklchColor,
} from './utils/oklch';

/** 默认基准 HEX 颜色 */
const DEFAULT_HEX = '#2563EB';

/**
 * OKLCH 现代化色彩工作台，以感知均匀的亮度与色度调节颜色，
 * 实时输出 oklch() CSS 文本与感知均匀色阶，全部运算在浏览器本地完成
 *
 * @returns OKLCH 色彩工作台交互界面
 */
function OklchWorkbench() {
  const { t } = useI18n();
  const [hexInput, setHexInput] = useState(DEFAULT_HEX);
  const [color, setColor] = useState<OklchColor>(() => {
    const rgb = parseHexToRgb(DEFAULT_HEX);
    return rgb ? rgbToOklch(rgb) : { lightness: 0.5, chroma: 0.18, hue: 250 };
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const previewRgb = useMemo(() => oklchToRgb(color), [color]);
  const previewHex = useMemo(() => formatRgbToHex(previewRgb), [previewRgb]);
  const oklchCss = useMemo(() => formatOklchCss(color), [color]);
  const shades = useMemo(() => buildOklchShades(color), [color]);

  const isValidHex = parseHexToRgb(hexInput) !== null;

  /**
   * 从 HEX 输入框同步基准色到 OKLCH 坐标
   */
  function syncFromHex() {
    const rgb = parseHexToRgb(hexInput);
    if (rgb) {
      setColor(rgbToOklch(rgb));
    }
  }

  /**
   * 更新 OKLCH 某一通道并回写 HEX 输入
   *
   * @param patch - 通道变更字段
   */
  function updateColor(patch: Partial<OklchColor>) {
    setColor((current) => {
      const next = { ...current, ...patch };
      setHexInput(formatRgbToHex(oklchToRgb(next)));
      return next;
    });
  }

  /**
   * 随机生成一个色度适中的 OKLCH 颜色
   */
  function randomize() {
    const next: OklchColor = {
      lightness: 0.45 + Math.random() * 0.25,
      chroma: 0.1 + Math.random() * 0.12,
      hue: Math.floor(Math.random() * 360),
    };
    setColor(next);
    setHexInput(formatRgbToHex(oklchToRgb(next)));
  }

  /**
   * 复制文本并在两秒内展示反馈
   *
   * @param text - 待复制文本
   * @param key - 反馈标识
   */
  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={previewHex}
            onChange={(event) => {
              setHexInput(event.target.value);
              const rgb = parseHexToRgb(event.target.value);
              if (rgb) setColor(rgbToOklch(rgb));
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
            className={`w-28 rounded-lg border bg-white px-3 py-2 font-mono text-xs focus:outline-none dark:bg-slate-800 ${
              isValidHex
                ? 'border-slate-300 text-slate-800 focus:border-slate-800 dark:border-slate-700 dark:text-slate-200'
                : 'border-rose-300 text-rose-600 dark:border-rose-800'
            }`}
          />
          {!isValidHex && (
            <span className="text-xs font-medium text-rose-500">
              {t('tools.oklch.invalidHex')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={randomize}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <Shuffle className="h-3.5 w-3.5 text-violet-500" />
          {t('tools.oklch.random')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div
            className="flex flex-1 items-end p-4"
            style={{ backgroundColor: previewHex }}
          >
            <span
              className="rounded-md bg-black/30 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm"
            >
              {oklchCss}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleCopy(oklchCss, 'css')}
            className="flex items-center justify-center gap-2 border-t border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copiedKey === 'css' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('common.copySuccess')}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {t('tools.oklch.copyCss')}
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
          <RangeRow
            label={t('tools.oklch.lightness')}
            value={`${(color.lightness * 100).toFixed(1)}%`}
            min={0}
            max={1}
            step={0.005}
            current={color.lightness}
            onChange={(value) => updateColor({ lightness: value })}
          />
          <RangeRow
            label={t('tools.oklch.chroma')}
            value={color.chroma.toFixed(3)}
            min={0}
            max={0.4}
            step={0.002}
            current={color.chroma}
            onChange={(value) => updateColor({ chroma: value })}
          />
          <RangeRow
            label={t('tools.oklch.hue')}
            value={`${color.hue.toFixed(0)}°`}
            min={0}
            max={360}
            step={1}
            current={color.hue}
            onChange={(value) => updateColor({ hue: value })}
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.oklch.shadesTitle')}
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-5 lg:grid-cols-10">
          {shades.map((shade) => (
            <button
              key={shade.level}
              type="button"
              title={shade.css}
              onClick={() => void handleCopy(shade.hex, shade.level)}
              className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 shadow-xs transition-transform hover:scale-105 dark:border-slate-700"
            >
              <span
                className="flex h-12 items-center justify-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  backgroundColor: shade.hex,
                  color: Number(shade.level) >= 500 ? '#FFFFFF' : '#0F172A',
                }}
              >
                {copiedKey === shade.level ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </span>
              <span className="bg-white py-1 text-center text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {shade.level}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 带标签与数值提示的滑杆行
 */
function RangeRow(props: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {props.label}
        </span>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {props.value}
        </span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.current}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="w-full accent-slate-900 dark:accent-slate-100"
      />
    </label>
  );
}

export default OklchWorkbench;
