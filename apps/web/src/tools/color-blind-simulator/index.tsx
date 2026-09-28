'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Image as ImageIcon,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  SAFE_PALETTE,
  isPaletteSafe,
  parseHexToRgb,
  simulateCanvas,
  type BlindType,
  type RgbColor,
} from './utils/blind';

/** 可选色觉类型 */
const BLIND_OPTIONS: BlindType[] = [
  'normal',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
];

/**
 * 色盲模拟器，上传图片后在多种色觉条件下并排预览，
 * 并校验调色板对色盲人群是否安全，全部运算在浏览器本地完成
 *
 * @returns 色盲模拟与安全调色板交互界面
 */
function ColorBlindSimulator() {
  const { t } = useI18n();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [paletteInput, setPaletteInput] = useState(SAFE_PALETTE.join(', '));
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  /**
   * 读取图片文件并绘制到源画布
   *
   * @param file - 图片文件
   */
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const image = new Image();
      image.onload = () => {
        imageRef.current = image;
        setImageSrc(src);
        window.requestAnimationFrame(() => {
          const canvas = sourceCanvasRef.current;
          if (!canvas) return;
          const maxSide = 360;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        });
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  }

  const palette = paletteInput
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter((value) => parseHexToRgb(value) !== null);

  /**
   * 复制单个安全色
   *
   * @param hex - HEX 颜色
   */
  async function handleCopy(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(null), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas ref={sourceCanvasRef} className="hidden" aria-hidden="true" />

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
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-slate-900 bg-slate-100 dark:border-slate-300 dark:bg-slate-800'
            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs dark:bg-slate-800">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6" />
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('tools.blind.uploadHint')}
        </span>
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
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
        >
          <Upload className="h-4 w-4" />
          {t('tools.blind.selectImage')}
        </button>
      </div>

      {imageSrc ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BLIND_OPTIONS.map((type) => (
            <SimulatedPreview
              key={type}
              type={type}
              label={t(`tools.blind.type_${type}`)}
              sourceCanvasRef={sourceCanvasRef}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.blind.paletteInput')}
        </div>
        <div className="p-4">
          <input
            type="text"
            value={paletteInput}
            onChange={(event) => setPaletteInput(event.target.value)}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {palette.map((hex) => {
              const rgb = parseHexToRgb(hex) as RgbColor;
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => void handleCopy(hex.toUpperCase())}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <span
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {copiedHex === hex.toUpperCase() ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as BlindType[]).map(
          (type) => {
            const safe = isPaletteSafe(palette, type);
            return (
              <div
                key={type}
                className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium ${
                  safe
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {safe ? (
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center font-bold">
                    !
                  </span>
                )}
                <span>
                  {t(`tools.blind.type_${type}`)} · {safe ? 'PASS' : 'RISK'}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

/**
 * 单个色觉条件的模拟预览块，源画布就绪后实时重绘
 */
function SimulatedPreview(props: {
  type: BlindType;
  label: string;
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const targetRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const source = props.sourceCanvasRef.current;
    const target = targetRef.current;
    if (!source || !target || source.width === 0) {
      return;
    }
    simulateCanvas(source, target, props.type);
  });

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        {props.label}
      </div>
      <canvas ref={targetRef} className="w-full" />
    </div>
  );
}

export default ColorBlindSimulator;
