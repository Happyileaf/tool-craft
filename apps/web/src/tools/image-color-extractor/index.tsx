'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  extractPalette,
  formatRgbToHex,
  samplePixelsFromCanvas,
  type ExtractedColor,
  type RgbColor,
} from './utils/extract';

/**
 * 可选的提取颜色数量集合
 */
const COLOR_COUNT_OPTIONS = [5, 6, 8, 10, 12];

/**
 * 图片取色器，上传图片后基于中位切分量化算法提取主色调，
 * 展示各颜色占比并支持一键复制与导出 CSS 变量，全部运算在浏览器本地完成
 *
 * @returns 图片取色与调色板提取交互界面
 */
function ImageColorExtractor() {
  const { t } = useI18n();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState(8);
  const [palette, setPalette] = useState<ExtractedColor[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * 依据当前画布像素与颜色数量重新执行提取
   */
  function refreshPalette() {
    const canvas = canvasRef.current;
    if (!canvas) {
      setPalette([]);
      return;
    }
    const pixels = samplePixelsFromCanvas(canvas);
    setPalette(extractPalette(pixels, colorCount));
  }

  useEffect(() => {
    refreshPalette();
  }, [colorCount]);

  /**
   * 读取图片文件并绘制到离屏画布，绘制完成后提取调色板
   *
   * @param file - 用户选择或拖入的图片文件
   */
  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('tools.imageColor.notImage'));
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const image = new Image();
      image.onload = () => {
        setImageSrc(src);
        window.requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const maxSide = 400;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          context?.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = samplePixelsFromCanvas(canvas);
          setPalette(extractPalette(pixels, colorCount));
        });
      };
      image.onerror = () => setErrorMessage(t('tools.imageColor.loadFailed'));
      image.src = src;
    };
    reader.onerror = () => setErrorMessage(t('tools.imageColor.loadFailed'));
    reader.readAsDataURL(file);
  }

  /**
   * 复制单个颜色的 HEX 值，并在 1.5 秒后恢复提示
   *
   * @param hex - 待复制的 HEX 颜色值
   */
  async function handleCopyColor(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(null), 1500);
  }

  /**
   * 将当前调色板拼装为 CSS 自定义属性文本并复制
   */
  async function handleCopyAll() {
    const css = palette
      .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
      .join('\n');
    await navigator.clipboard.writeText(`:root {\n${css}\n}`);
  }

  /**
   * 将调色板导出为 .css 文件
   */
  function handleDownloadCss() {
    const css = palette
      .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
      .join('\n');
    const blob = new Blob([`:root {\n${css}\n}`], { type: 'text/css' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'palette.css';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="flex flex-col gap-5">
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

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
          if (file) void handleFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-slate-900 bg-slate-100 dark:border-slate-300 dark:bg-slate-800'
            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={t('tools.imageColor.previewAlt')}
            className="max-h-64 rounded-lg border border-slate-200 shadow-xs dark:border-slate-700"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs dark:bg-slate-800 dark:text-slate-500">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {imageSrc
              ? t('tools.imageColor.replaceHint')
              : t('tools.imageColor.dropHint')}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('tools.imageColor.supportFormats')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Upload className="h-4 w-4" />
            {t('tools.imageColor.selectImage')}
          </button>
        </div>
        {errorMessage && (
          <span className="text-xs font-medium text-rose-500">{errorMessage}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('tools.imageColor.colorCount')}
          </span>
          <div className="flex items-center gap-1">
            {COLOR_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setColorCount(count)}
                className={`h-7 w-8 rounded-md text-xs font-semibold transition-colors ${
                  colorCount === count
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyAll()}
            disabled={palette.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Copy className="h-3.5 w-3.5" />
            {t('tools.imageColor.copyCss')}
          </button>
          <button
            type="button"
            onClick={handleDownloadCss}
            disabled={palette.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            {t('tools.imageColor.downloadCss')}
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          {t('tools.imageColor.resultTitle')}
        </div>
        {palette.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('tools.imageColor.empty')}
          </div>
        ) : (
          <div className="flex flex-col">
            {palette.map((color) => {
              const luminance =
                0.2126 * color.rgb.r + 0.7152 * color.rgb.g + 0.0722 * color.rgb.b;
              const textColor: RgbColor =
                luminance > 160
                  ? { r: 15, g: 23, b: 42 }
                  : { r: 255, g: 255, b: 255 };
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => void handleCopyColor(color.hex)}
                  className="flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span
                    className="flex h-10 w-16 items-center justify-center rounded-md font-mono text-[10px] font-bold shadow-xs"
                    style={{
                      backgroundColor: color.hex,
                      color: formatRgbToHex(textColor),
                    }}
                  >
                    {Math.round(color.ratio * 100)}%
                  </span>
                  <span className="flex-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                    {color.hex}
                  </span>
                  <span className="hidden font-mono text-xs text-slate-400 sm:block dark:text-slate-500">
                    RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center text-slate-400 dark:text-slate-500">
                    {copiedHex === color.hex ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageColorExtractor;
