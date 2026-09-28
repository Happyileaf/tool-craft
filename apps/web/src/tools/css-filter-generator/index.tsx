'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, Copy, Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  FILTER_PRESETS,
  buildFilterCss,
  buildGlassCss,
  createDefaultFilter,
  formatRgba,
  type FilterSettings,
  type GlassSettings,
} from './utils/filter';

/** 默认毛玻璃参数 */
const DEFAULT_GLASS: GlassSettings = {
  opacity: 55,
  blur: 12,
  saturate: 180,
  radius: 16,
  borderWidth: 1,
  borderColor: '#FFFFFF',
  borderOpacity: 45,
};

/** 毛玻璃预览区的彩色背景，用于检验模糊与饱和效果 */
const GLASS_BACKGROUND =
  'linear-gradient(120deg, #f472b6 0%, #a78bfa 22%, #60a5fa 45%, #34d399 68%, #fbbf24 100%)';

/** 滤镜参数滑杆配置 */
const FILTER_FIELDS: {
  key: keyof FilterSettings;
  labelKey: string;
  min: number;
  max: number;
  unit: string;
}[] = [
  { key: 'blur', labelKey: 'tools.filter.blur', min: 0, max: 20, unit: 'px' },
  { key: 'brightness', labelKey: 'tools.filter.brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast', labelKey: 'tools.filter.contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturate', labelKey: 'tools.filter.saturate', min: 0, max: 200, unit: '%' },
  { key: 'grayscale', labelKey: 'tools.filter.grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia', labelKey: 'tools.filter.sepia', min: 0, max: 100, unit: '%' },
  { key: 'invert', labelKey: 'tools.filter.invert', min: 0, max: 100, unit: '%' },
  { key: 'hueRotate', labelKey: 'tools.filter.hueRotate', min: 0, max: 360, unit: 'deg' },
];

/** 毛玻璃参数滑杆配置 */
const GLASS_FIELDS: {
  key: keyof GlassSettings;
  labelKey: string;
  min: number;
  max: number;
  unit: string;
}[] = [
  { key: 'opacity', labelKey: 'tools.filter.glassOpacity', min: 0, max: 100, unit: '%' },
  { key: 'blur', labelKey: 'tools.filter.glassBlur', min: 0, max: 40, unit: 'px' },
  { key: 'saturate', labelKey: 'tools.filter.glassSaturate', min: 0, max: 300, unit: '%' },
  { key: 'radius', labelKey: 'tools.filter.glassRadius', min: 0, max: 40, unit: 'px' },
  { key: 'borderWidth', labelKey: 'tools.filter.glassBorderWidth', min: 0, max: 8, unit: 'px' },
  { key: 'borderOpacity', labelKey: 'tools.filter.glassBorderOpacity', min: 0, max: 100, unit: '%' },
];

/**
 * CSS 滤镜与毛玻璃生成器，支持实时调节 filter 函数链与 backdrop-filter 毛玻璃卡片，
 * 内置滤镜预设与图片上传预览，全部运算在浏览器本地完成
 *
 * @returns 滤镜与毛玻璃生成器交互界面
 */
function CssFilterGenerator() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'filter' | 'glass'>('filter');
  const [filter, setFilter] = useState<FilterSettings>(createDefaultFilter());
  const [glass, setGlass] = useState<GlassSettings>(DEFAULT_GLASS);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterValue = useMemo(() => buildFilterCss(filter), [filter]);
  const filterCss = `filter: ${filterValue || 'none'};`;
  const glassCss = useMemo(() => buildGlassCss(glass), [glass]);
  const outputCss = mode === 'filter' ? filterCss : glassCss;

  /**
   * 读取用户选择或拖入的图片文件
   *
   * @param file - 图片文件
   */
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('tools.filter.notImage'));
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => setErrorMessage(t('tools.filter.loadFailed'));
    reader.readAsDataURL(file);
  }

  /**
   * 应用滤镜预设，未覆盖的字段回到默认值
   *
   * @param preset - 滤镜预设
   */
  function applyPreset(preset: (typeof FILTER_PRESETS)[number]) {
    setFilter({ ...createDefaultFilter(), ...preset.settings });
  }

  /**
   * 复制当前 CSS 声明
   */
  async function handleCopy() {
    await navigator.clipboard.writeText(outputCss);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('filter')}
            className={
              mode === 'filter'
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.filter.modeFilter')}
          </button>
          <button
            type="button"
            onClick={() => setMode('glass')}
            className={
              mode === 'glass'
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.filter.modeGlass')}
          </button>
        </div>

        {mode === 'filter' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('tools.filter.presets')}
            </span>
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                {preset.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter(createDefaultFilter())}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('common.reset')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setGlass(DEFAULT_GLASS)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('common.reset')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            {t('tools.filter.preview')}
          </div>
          {mode === 'filter' ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={`flex h-80 flex-col items-center justify-center gap-3 rounded-b-xl p-6 text-center transition-colors ${
                isDragging
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'bg-slate-100 dark:bg-slate-950'
              }`}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={t('tools.filter.previewAlt')}
                  className="max-h-60 rounded-lg border border-slate-200 shadow-xs dark:border-slate-700"
                  style={{ filter: filterValue }}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs dark:bg-slate-800 dark:text-slate-500">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <Upload className="h-4 w-4" />
                {imageSrc ? t('tools.filter.replaceImage') : t('tools.filter.selectImage')}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('tools.filter.uploadHint')}
              </span>
              {errorMessage && (
                <span className="text-xs font-medium text-rose-500">{errorMessage}</span>
              )}
            </div>
          ) : (
            <div
              className="relative flex h-80 items-center justify-center overflow-hidden rounded-b-xl p-6"
              style={{ background: GLASS_BACKGROUND }}
            >
              <div
                className="flex w-64 flex-col gap-2 px-6 py-5"
                style={{
                  backgroundColor: formatRgba('#FFFFFF', glass.opacity),
                  backdropFilter: `blur(${glass.blur}px) saturate(${glass.saturate}%)`,
                  WebkitBackdropFilter: `blur(${glass.blur}px) saturate(${glass.saturate}%)`,
                  borderRadius: glass.radius,
                  border: `${glass.borderWidth}px solid ${formatRgba(
                    glass.borderColor,
                    glass.borderOpacity,
                  )}`,
                }}
              >
                <span className="text-sm font-semibold text-slate-900">
                  Glassmorphism
                </span>
                <span className="text-xs text-slate-700/80">
                  backdrop-filter: blur · saturate
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {mode === 'filter'
              ? t('tools.filter.filterSettings')
              : t('tools.filter.glassSettings')}
          </span>
          {mode === 'filter'
            ? FILTER_FIELDS.map((field) => (
                <RangeRow
                  key={field.key}
                  label={t(field.labelKey)}
                  value={filter[field.key]}
                  min={field.min}
                  max={field.max}
                  unit={field.unit}
                  onChange={(value) =>
                    setFilter((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))
            : GLASS_FIELDS.map((field) => (
                <RangeRow
                  key={field.key}
                  label={t(field.labelKey)}
                  value={glass[field.key] as number}
                  min={field.min}
                  max={field.max}
                  unit={field.unit}
                  onChange={(value) =>
                    setGlass((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))}
          {mode === 'glass' && (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">
                {t('tools.filter.glassBorderColor')}
              </span>
              <input
                type="color"
                value={glass.borderColor}
                onChange={(event) =>
                  setGlass((current) => ({ ...current, borderColor: event.target.value }))
                }
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="font-mono">{glass.borderColor}</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{mode === 'filter' ? t('tools.filter.cssTitle') : t('tools.filter.glassCssTitle')}</span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('common.copySuccess')}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {t('common.copy')}
              </>
            )}
          </button>
        </div>
        <pre className="overflow-auto bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
          {outputCss}
        </pre>
      </div>
    </div>
  );
}

/**
 * 带数值显示的滑杆行
 */
function RangeRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center justify-between font-medium text-slate-500 dark:text-slate-400">
        <span>{props.label}</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {props.value}
          {props.unit}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="w-full accent-slate-900 dark:accent-slate-100"
      />
    </label>
  );
}

export default CssFilterGenerator;
