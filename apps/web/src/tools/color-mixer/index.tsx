'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  buildColorMixCss,
  buildMixSteps,
  formatRgbToHex,
  mixColors,
  parseHexToRgb,
} from './utils/mix';

/**
 * 混合色调色计算器，支持两种颜色按比例混合并展示等分中间色，
 * 实时输出 HEX 与现代 color-mix() CSS 文本，全部运算在浏览器本地完成
 *
 * @returns 混合色调色计算器交互界面
 */
function ColorMixer() {
  const { t } = useI18n();
  const [firstHex, setFirstHex] = useState('#2563EB');
  const [secondHex, setSecondHex] = useState('#EC4899');
  const [ratio, setRatio] = useState(50);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const firstRgb = parseHexToRgb(firstHex);
  const secondRgb = parseHexToRgb(secondHex);
  const isValid = firstRgb !== null && secondRgb !== null;

  const mixed = useMemo(() => {
    if (!firstRgb || !secondRgb) {
      return '#000000';
    }
    return formatRgbToHex(mixColors(firstRgb, secondRgb, ratio));
  }, [firstRgb, secondRgb, ratio]);

  const steps = useMemo(() => {
    if (!firstRgb || !secondRgb) {
      return [];
    }
    return buildMixSteps(firstRgb, secondRgb, 8);
  }, [firstRgb, secondRgb]);

  const colorMixCss = useMemo(
    () => buildColorMixCss(firstHex, secondHex, ratio),
    [firstHex, secondHex, ratio],
  );

  /**
   * 复制文本并展示反馈
   *
   * @param text - 待复制文本
   * @param key - 反馈标识
   */
  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ColorInputCard
          title={t('tools.mixer.colorA')}
          value={firstHex}
          onChange={setFirstHex}
          ratioLabel={`${ratio}%`}
        />
        <ColorInputCard
          title={t('tools.mixer.colorB')}
          value={secondHex}
          onChange={setSecondHex}
          ratioLabel={`${100 - ratio}%`}
        />
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.mixer.ratio')}
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {ratio} / {100 - ratio}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={ratio}
          onChange={(event) => setRatio(Number(event.target.value))}
          className="w-full accent-slate-900 dark:accent-slate-100"
        />
        {!isValid && (
          <span className="mt-2 text-xs font-medium text-rose-500">
            {t('tools.mixer.invalid')}
          </span>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{t('tools.mixer.result')}</span>
          <button
            type="button"
            onClick={() => void handleCopy(mixed, 'mixed')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {copiedKey === 'mixed' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('common.copySuccess')}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {mixed}
              </>
            )}
          </button>
        </div>
        <div className="h-40" style={{ backgroundColor: mixed }} />
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.mixer.steps')}
        </div>
        <div className="flex">
          {steps.map((step) => (
            <button
              key={step.ratio}
              type="button"
              title={`${step.hex} · ${step.ratio}%`}
              onClick={() => void handleCopy(step.hex, `step-${step.ratio}`)}
              className="h-16 flex-1 transition-all hover:flex-[1.6]"
              style={{ backgroundColor: step.hex }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{t('tools.mixer.cssTitle')}</span>
          <button
            type="button"
            onClick={() => void handleCopy(colorMixCss, 'css')}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {copiedKey === 'css' ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
          {colorMixCss}
        </div>
      </div>
    </div>
  );
}

/**
 * 单侧颜色输入卡片
 */
function ColorInputCard(props: {
  title: string;
  value: string;
  ratioLabel: string;
  onChange: (value: string) => void;
}) {
  const valid = parseHexToRgb(props.value) !== null;
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        <span>{props.title}</span>
        <span className="font-mono text-slate-400">{props.ratioLabel}</span>
      </div>
      <div
        className="flex h-28 items-center justify-center"
        style={{ backgroundColor: valid ? props.value : '#F1F5F9' }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xs dark:border-slate-700 dark:bg-slate-800">
          <input
            type="color"
            value={valid ? props.value : '#000000'}
            onChange={(event) => props.onChange(event.target.value)}
            className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            spellCheck={false}
            className="w-24 border-0 bg-transparent font-mono text-xs text-slate-800 focus:outline-none dark:text-slate-200"
          />
        </div>
      </div>
    </div>
  );
}

export default ColorMixer;
