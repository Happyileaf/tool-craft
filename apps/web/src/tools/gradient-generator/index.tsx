'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  GRADIENT_PRESETS,
  buildGradientCss,
  buildTailwindClass,
  type GradientStop,
  type GradientType,
} from './utils/gradient';

/** 生成颜色节点唯一标识用的自增基数 */
let stopIdSeed = 0;

/**
 * 创建一个新的渐变颜色节点
 *
 * @param color - 节点 HEX 颜色
 * @param position - 节点位置，取值 0 至 100
 * @returns 带唯一标识的渐变节点
 */
function createStop(color: string, position: number): GradientStop {
  stopIdSeed += 1;
  return { id: `stop-${stopIdSeed}`, color, position };
}

/**
 * 渐变色生成器，支持线性、径向与圆锥三种渐变，可调节角度、增删拖拽颜色节点，
 * 实时输出 CSS 与 Tailwind 任意值类名，全部运算在浏览器本地完成
 *
 * @returns 渐变色生成器交互界面
 */
function GradientGenerator() {
  const { t } = useI18n();
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    createStop('#2563EB', 0),
    createStop('#06B6D4', 100),
  ]);
  const [copiedKey, setCopiedKey] = useState<'css' | 'tailwind' | null>(null);

  const gradientCss = useMemo(
    () => buildGradientCss(type, angle, stops),
    [type, angle, stops],
  );
  const tailwindClass = useMemo(
    () => buildTailwindClass(type, angle, stops),
    [type, angle, stops],
  );

  const typeOptions: GradientType[] = ['linear', 'radial', 'conic'];

  /**
   * 更新指定节点的字段值
   *
   * @param id - 目标节点标识
   * @param patch - 需要合并的字段变更
   */
  function updateStop(id: string, patch: Partial<GradientStop>) {
    setStops((current) =>
      current.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              ...patch,
              position:
                patch.position === undefined
                  ? stop.position
                  : Math.min(100, Math.max(0, patch.position)),
            }
          : stop,
      ),
    );
  }

  /**
   * 删除指定节点，至少保留两个节点
   *
   * @param id - 目标节点标识
   */
  function removeStop(id: string) {
    setStops((current) =>
      current.length <= 2 ? current : current.filter((stop) => stop.id !== id),
    );
  }

  /**
   * 在最后一个节点之前补充一个中间位置的新节点
   */
  function addStop() {
    const sorted = [...stops].sort(
      (first, second) => first.position - second.position,
    );
    const last = sorted[sorted.length - 1];
    const color = last?.color ?? '#8B5CF6';
    setStops((current) => [...current, createStop(color, 50)]);
  }

  /**
   * 随机生成三节点渐变并随机切换角度
   */
  function randomize() {
    const hueA = Math.floor(Math.random() * 360);
    const hueB = Math.floor(Math.random() * 360);
    const hueC = Math.floor(Math.random() * 360);
    setStops([
      createStop(`hsl(${hueA}, 85%, 55%)`, 0),
      createStop(`hsl(${hueB}, 85%, 60%)`, 50),
      createStop(`hsl(${hueC}, 85%, 55%)`, 100),
    ]);
    setAngle(Math.floor(Math.random() * 360));
  }

  /**
   * 复制渐变代码并在两秒内展示反馈
   *
   * @param text - 待复制代码
   * @param key - 代码类型标识
   */
  async function handleCopy(text: string, key: 'css' | 'tailwind') {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          {typeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={
                type === option
                  ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            >
              {t(`tools.gradient.type_${option}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {type !== 'radial' ? (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">
                {t('tools.gradient.angle')} {angle}°
              </span>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="w-32 accent-slate-900 dark:accent-slate-100"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={randomize}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Shuffle className="h-3.5 w-3.5 text-violet-500" />
            {t('tools.gradient.random')}
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.gradient.preview')}
        </div>
        <div className="h-60 w-full sm:h-72" style={{ backgroundImage: gradientCss }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('tools.gradient.presets')}
        </span>
        {GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            title={preset.name}
            onClick={() =>
              setStops(
                preset.stops.map((stop) => createStop(stop.color, stop.position)),
              )
            }
            className="h-7 w-12 rounded-md border border-slate-200 shadow-xs transition-transform hover:scale-105 dark:border-slate-700"
            style={{
              backgroundImage: `linear-gradient(135deg, ${preset.stops
                .map((stop) => `${stop.color} ${stop.position}%`)
                .join(', ')})`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.gradient.stops')}
          </span>
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('tools.gradient.addStop')}
          </button>
        </div>
        {[...stops]
          .sort((first, second) => first.position - second.position)
          .map((stop) => (
            <div
              key={stop.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <input
                type="color"
                value={normalizeColorValue(stop.color)}
                onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                type="text"
                value={stop.color}
                onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                spellCheck={false}
                className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={stop.position}
                onChange={(event) =>
                  updateStop(stop.id, { position: Number(event.target.value) })
                }
                className="flex-1 accent-slate-900 dark:accent-slate-100"
              />
              <span className="w-12 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                {stop.position}%
              </span>
              <button
                type="button"
                onClick={() => removeStop(stop.id)}
                disabled={stops.length <= 2}
                className="text-slate-400 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutputPanel
          label={t('tools.gradient.cssOutput')}
          value={`background: ${gradientCss};`}
          copied={copiedKey === 'css'}
          onCopy={() => void handleCopy(`background: ${gradientCss};`, 'css')}
        />
        <OutputPanel
          label={t('tools.gradient.tailwindOutput')}
          value={tailwindClass}
          copied={copiedKey === 'tailwind'}
          onCopy={() => void handleCopy(tailwindClass, 'tailwind')}
        />
      </div>
    </div>
  );
}

/**
 * 输出面板，展示单行代码并提供复制能力
 */
function OutputPanel(props: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        <span>{props.label}</span>
        <button
          type="button"
          onClick={props.onCopy}
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {props.copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">✓</span>
            </>
          ) : (
            <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          )}
        </button>
      </div>
      <div className="break-all bg-slate-900 p-4 font-mono text-xs text-emerald-400 dark:bg-slate-950">
        {props.value}
      </div>
    </div>
  );
}

/**
 * 将任意 CSS 颜色文本规整为原生取色器可用的六位 HEX，无法解析时回退为黑色
 *
 * @param color - CSS 颜色文本
 * @returns 以井号开头的六位 HEX 颜色
 */
function normalizeColorValue(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color.trim())) {
    return color.trim();
  }
  if (typeof document === 'undefined') {
    return '#000000';
  }
  const probe = document.createElement('div');
  probe.style.color = '';
  probe.style.color = color;
  document.body.appendChild(probe);
  const computed = window.getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = computed.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) {
    return '#000000';
  }
  const channels = match
    .slice(0, 3)
    .map((value) =>
      Math.round(Number(value))
        .toString(16)
        .padStart(2, '0'),
    );
  return `#${channels.join('').toUpperCase()}`;
}

export default GradientGenerator;
