'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  Sliders,
  Upload,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  AspectRatioEnum,
  AspectRatioOptions,
  DEFAULT_QUALITY,
  ImageFormatEnum,
  ImageFormatOptions,
  MAX_DIMENSION,
  MAX_QUALITY,
  MIN_DIMENSION,
  MIN_QUALITY,
  SAMPLE_IMAGE_MAP,
  SampleImageEnum,
  SampleImageOptions,
} from './constants';
import {
  formatFileSize,
  getCropRect,
  loadImageFile,
  loadRemoteImage,
  resizeImage,
} from './utils/image';

/**
 * 压缩结果状态
 */
interface CompressResult {
  /** 输出图片的对象地址，用于预览与下载 */
  dataUrl: string;
  /** 输出图片的二进制对象 */
  blob: Blob;
}

/**
 * 当前画面的来源标识，用于区分预设样图与用户上传图片
 */
type ImageSource = SampleImageEnum | 'custom';

/**
 * 图片压缩调整工具页，支持预设样图与本地图片上传，
 * 可自定义输出格式、质量、尺寸与宽高比裁切，全部运算通过 Canvas 在浏览器本地完成
 *
 * @returns 图片压缩调整工具交互界面
 */
function ImageResizer() {
  const { t } = useI18n();
  const [imageSource, setImageSource] = useState<ImageSource>(
    SampleImageEnum.Landscape,
  );
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState(
    SAMPLE_IMAGE_MAP[SampleImageEnum.Landscape].url,
  );
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [originalSize, setOriginalSize] = useState(
    SAMPLE_IMAGE_MAP[SampleImageEnum.Landscape].size,
  );
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioEnum>(
    AspectRatioEnum.Original,
  );
  const [format, setFormat] = useState<ImageFormatEnum>(ImageFormatEnum.WEBP);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const resultUrlRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  /**
   * 切换到指定预设样图，加载远程图片并套用原型标注的宽高与体积
   *
   * @param sample - 预设样图枚举
   */
  async function handleSelectSample(sample: SampleImageEnum) {
    const meta = SAMPLE_IMAGE_MAP[sample];
    setImageSource(sample);
    setIsLoading(true);
    setErrorMessage(null);
    setAspectRatio(AspectRatioEnum.Original);
    try {
      const image = await loadRemoteImage(meta.url);
      setSourceImage(image);
      setPreviewSrc(meta.url);
      setOriginalWidth(image.naturalWidth);
      setOriginalHeight(image.naturalHeight);
      setOriginalSize(meta.size);
      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : t('common.loadFailed'));
    }
  }

  /**
   * 读取用户上传的本地图片，以真实宽高与体积初始化参数
   *
   * @param file - 文件选择框回传的图片文件
   */
  async function handleUpload(file: File) {
    setIsLoading(true);
    setErrorMessage(null);
    setAspectRatio(AspectRatioEnum.Original);
    try {
      const loaded = await loadImageFile(file);
      setImageSource('custom');
      setSourceImage(loaded.element);
      setPreviewSrc(loaded.dataUrl);
      setOriginalWidth(loaded.info.width);
      setOriginalHeight(loaded.info.height);
      setOriginalSize(loaded.info.size);
      setWidth(loaded.info.width);
      setHeight(loaded.info.height);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : t('common.loadFailed'));
    }
  }

  /**
   * 应用宽高比裁切预设，依据原图尺寸同步目标宽高
   *
   * @param ratio - 宽高比裁切预设
   */
  function handleAspectRatioChange(ratio: AspectRatioEnum) {
    setAspectRatio(ratio);
    const cropRect = getCropRect(originalWidth, originalHeight, ratio);
    setWidth(cropRect.width);
    setHeight(cropRect.height);
  }

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    void handleSelectSample(SampleImageEnum.Landscape);
  });

  useEffect(() => {
    if (!sourceImage || originalWidth === 0 || originalHeight === 0) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsCompressing(true);

    const targetWidth = Math.min(
      MAX_DIMENSION,
      Math.max(MIN_DIMENSION, Math.round(width || MIN_DIMENSION)),
    );
    const targetHeight = Math.min(
      MAX_DIMENSION,
      Math.max(MIN_DIMENSION, Math.round(height || MIN_DIMENSION)),
    );
    const cropRect = getCropRect(originalWidth, originalHeight, aspectRatio);

    let cancelled = false;
    resizeImage({
      source: sourceImage,
      width: targetWidth,
      height: targetHeight,
      format,
      quality: quality / 100,
      crop: cropRect,
    })
      .then((resized) => {
        if (cancelled || requestId !== requestIdRef.current) {
          URL.revokeObjectURL(resized.dataUrl);
          return;
        }
        setResult((previous) => {
          if (previous) URL.revokeObjectURL(previous.dataUrl);
          resultUrlRef.current = resized.dataUrl;
          return { blob: resized.blob, dataUrl: resized.dataUrl };
        });
        setIsCompressing(false);
      })
      .catch((error: unknown) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setErrorMessage(error instanceof Error ? error.message : t('common.loadFailed'));
        setIsCompressing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceImage, width, height, format, quality, aspectRatio, originalWidth, originalHeight, t]);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  /**
   * 下载当前压缩结果，以格式后缀命名输出文件
   */
  function handleDownload() {
    if (!result) return;
    const objectUrl = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    const extension = format === ImageFormatEnum.JPEG ? 'jpg' : format.split('/')[1];
    link.download = `optimized-image.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  const savedPercent =
    originalSize > 0
      ? Math.round(((originalSize - (result?.blob.size ?? 0)) / originalSize) * 100)
      : 0;
  const formatSuffix = format.split('/')[1]?.toUpperCase() ?? '';
  const contrastPercent = 100 - (100 - quality) * 0.05;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:text-sm"
          >
            <Upload className="h-4 w-4" />
            <span>{t('tools.image.selectLocal')}</span>
          </button>

          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t('tools.image.orPickSample')}
          </span>
          <div className="flex items-center gap-1.5">
            {SampleImageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void handleSelectSample(option.value)}
                className={
                  imageSource === option.value
                    ? 'rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{t('tools.image.canvasLocalNotice')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Sliders className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('tools.image.controlsTitle')}
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t('tools.image.qualityLabel')}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                {quality}%
              </span>
            </div>
            <input
              type="range"
              min={MIN_QUALITY}
              max={MAX_QUALITY}
              value={quality}
              disabled={format === ImageFormatEnum.PNG}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="w-full cursor-pointer accent-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:accent-slate-100"
            />
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>{t('tools.image.qualityMin')}</span>
              <span>{t('tools.image.qualityBalanced')}</span>
              <span>{t('tools.image.qualityMax')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t('tools.image.targetFormat')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ImageFormatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormat(option.value)}
                  className={
                    format === option.value
                      ? 'flex flex-col items-center rounded-lg border border-slate-900 bg-slate-900 px-1 py-2 text-xs font-medium text-white shadow-xs dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'flex flex-col items-center rounded-lg border border-slate-200 bg-white px-1 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }
                >
                  <span className="font-bold">
                    {option.value.split('/')[1]?.toUpperCase()}
                  </span>
                  <span
                    className={
                      format === option.value
                        ? 'text-[10px] text-slate-300 dark:text-slate-600'
                        : 'text-[10px] text-slate-400 dark:text-slate-500'
                    }
                  >
                    {t(option.label)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t('tools.image.aspectRatioLabel')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {AspectRatioOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAspectRatioChange(option.value)}
                  className={
                    aspectRatio === option.value
                      ? 'rounded-md border border-slate-900 bg-slate-900 py-1.5 text-xs font-medium text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'rounded-md border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-800/80 dark:bg-emerald-950/40">
            <div className="mb-1 text-xs font-medium text-emerald-900 dark:text-emerald-200">
              {t('tools.image.savingsTitle')}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {savedPercent >= 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`}
              </span>
              <div className="text-right text-xs text-emerald-800 dark:text-emerald-300">
                <div>{t('tools.image.fromSize', { size: formatFileSize(originalSize) })}</div>
                <div className="font-bold">
                  {t('tools.image.toSize', {
                    size: result ? formatFileSize(result.blob.size) : '…',
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!result || isCompressing || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isCompressing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t('tools.image.downloadWithFormat', { format: formatSuffix })}
          </button>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span>{t('tools.image.compareTitle')}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span>
                {t('tools.image.originalLabel', {
                  width: originalWidth,
                  height: originalHeight,
                })}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {t('tools.image.targetLabel', { width, height })}
              </span>
            </div>
          </div>

          <div className="relative flex min-h-[380px] flex-1 items-center justify-center bg-slate-900/5 p-6 backdrop-blur-xs dark:bg-slate-950/40">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            ) : (
              <div className="relative max-h-[340px] max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                <img
                  src={previewSrc}
                  alt="preview"
                  className="max-h-[320px] w-auto object-contain transition-all duration-300"
                  style={{
                    filter: `contrast(${contrastPercent}%)`,
                    aspectRatio:
                      aspectRatio === AspectRatioEnum.SixteenToNine
                        ? '16 / 9'
                        : aspectRatio === AspectRatioEnum.FourToThree
                          ? '4 / 3'
                          : aspectRatio === AspectRatioEnum.OneToOne
                            ? '1 / 1'
                            : 'auto',
                  }}
                />
                <div className="absolute left-3 top-3 rounded-md bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-sm">
                  {t('tools.image.qualityBadge', {
                    quality,
                    format: formatSuffix,
                  })}
                </div>
              </div>
            )}
          </div>

          {errorMessage ? (
            <div className="px-4 py-2 text-xs text-rose-600 dark:text-rose-400">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <span>{t('tools.image.footerFormats')}</span>
            <span>{t('tools.image.footerNoLimit')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageResizer;
