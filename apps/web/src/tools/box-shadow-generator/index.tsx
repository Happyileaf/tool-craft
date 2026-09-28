'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  SHADOW_PRESETS,
  buildShadowCss,
  createLayer,
  type ShadowLayer,
} from './utils/shadow';

/**
 * 阴影生成器，支持多层 box-shadow 的偏移、模糊、扩散、颜色与透明度调节，
 * 内置柔和、悬浮、新拟态等预设并实时输出 CSS，全部运算在浏览器本地完成
 *
 * @returns 阴影生成器交互界面
 */
function BoxShadowGenerator() {
  const { t } = useI18n();
  const [layers, setLayers] = useState<ShadowLayer[]>([createLayer()]);
  const [copied, setCopied] = useState(false);

  const shadowValue = useMemo(() => buildShadowCss(layers), [layers]);
  const shadowCss = `box-shadow: ${shadowValue};`;

  /**
   * 更新指定阴影层字段
   *
   * @param index - 层序号
   * @param patch - 字段变更
   */
  function updateLayer(index: number, patch: Partial<ShadowLayer>) {
    setLayers((current) =>
      current.map((layer, layerIndex) =>
        layerIndex === index ? { ...layer, ...patch } : layer,
      ),
    );
  }

  /**
   * 删除指定层，至少保留一层
   *
   * @param index - 层序号
   */
  function removeLayer(index: number) {
    setLayers((current) =>
      current.length <= 1 ? current : current.filter((_, i) => i !== index),
    );
  }

  /**
   * 复制完整 CSS 声明
   */
  async function handleCopy() {
    await navigator.clipboard.writeText(shadowCss);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('tools.shadow.presets')}
        </span>
        {SHADOW_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => setLayers(preset.layers.map((layer) => ({ ...layer })))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.shadow.preview')}
        </div>
        <div className="flex h-56 items-center justify-center bg-slate-100 dark:bg-slate-950">
          <div
            className="h-32 w-48 rounded-xl bg-white dark:bg-slate-800"
            style={{ boxShadow: shadowValue }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {layers.map((layer, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('tools.shadow.layer')} {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeLayer(index)}
                disabled={layers.length <= 1}
                className="text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumberField
                label="X"
                value={layer.offsetX}
                onChange={(value) => updateLayer(index, { offsetX: value })}
              />
              <NumberField
                label="Y"
                value={layer.offsetY}
                onChange={(value) => updateLayer(index, { offsetY: value })}
              />
              <NumberField
                label={t('tools.shadow.blur')}
                value={layer.blur}
                min={0}
                onChange={(value) => updateLayer(index, { blur: value })}
              />
              <NumberField
                label={t('tools.shadow.spread')}
                value={layer.spread}
                onChange={(value) => updateLayer(index, { spread: value })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={layer.color}
                onChange={(event) => updateLayer(index, { color: event.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="w-24 font-mono text-xs text-slate-600 dark:text-slate-300">
                {layer.color}
              </span>
              <label className="flex flex-1 items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">{t('tools.shadow.opacity')}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layer.opacity}
                  onChange={(event) =>
                    updateLayer(index, { opacity: Number(event.target.value) })
                  }
                  className="flex-1 accent-slate-900 dark:accent-slate-100"
                />
                <span className="w-10 text-right font-mono">{layer.opacity}%</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={layer.inset}
                  onChange={(event) => updateLayer(index, { inset: event.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100"
                />
                inset
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setLayers((current) => [...current, createLayer()])}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-300 dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
        {t('tools.shadow.addLayer')}
      </button>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <span>{t('tools.shadow.cssTitle')}</span>
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
        <div className="bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
          {shadowCss}
        </div>
      </div>
    </div>
  );
}

/**
 * 带标签的数字输入字段
 */
function NumberField(props: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-500 dark:text-slate-400">
        {props.label}
      </span>
      <input
        type="number"
        value={props.value}
        min={props.min}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      />
    </label>
  );
}

export default BoxShadowGenerator;
