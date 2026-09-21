'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  QrCode,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_DARK_COLOR,
  DEFAULT_LIGHT_COLOR,
  DEFAULT_SIZE,
  DEFAULT_TEXT,
  QrErrorLevelDescKeyMap,
  QrErrorLevelEnum,
  QrErrorLevelLabelKeyMap,
  QrErrorLevelOptions,
  SIZE_MAX,
  SIZE_MIN,
} from './constants';
import { generateQrDataUrl, generateQrSvg } from './utils/qr';

/**
 * 二维码生成工具页，输入链接或文本后本地实时生成二维码，
 * 支持调整容错等级、尺寸、前景色与背景色，并可下载 PNG / SVG
 *
 * @returns 二维码生成工具交互界面
 */
function QrGenerator() {
  const { t } = useI18n();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [errorLevel, setErrorLevel] = useState<QrErrorLevelEnum>(
    QrErrorLevelEnum.M,
  );
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [darkColor, setDarkColor] = useState(DEFAULT_DARK_COLOR);
  const [lightColor, setLightColor] = useState(DEFAULT_LIGHT_COLOR);
  const [dataUrl, setDataUrl] = useState('');
  const [svg, setSvg] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /**
     * 根据当前配置并行生成 PNG Data URL 与 SVG 字符串
     */
    async function generate() {
      if (!text.trim()) {
        setDataUrl('');
        setSvg('');
        setErrorMessage(t('tools.qr.emptyContent'));
        return;
      }
      setIsGenerating(true);
      setErrorMessage(null);
      try {
        const options = { errorLevel, size, darkColor, lightColor };
        const [nextDataUrl, nextSvg] = await Promise.all([
          generateQrDataUrl(text, options),
          generateQrSvg(text, options),
        ]);
        if (!cancelled) {
          setDataUrl(nextDataUrl);
          setSvg(nextSvg);
        }
      } catch (error) {
        if (!cancelled) {
          setDataUrl('');
          setSvg('');
          setErrorMessage(
            error instanceof Error ? error.message : t('tools.qr.generateFailed'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [text, errorLevel, size, darkColor, lightColor, t]);

  /**
   * 复制当前二维码内容文本到剪贴板，并在两秒后恢复按钮状态
   */
  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(t('common.copyFailed'));
    }
  }

  /**
   * 通过隐藏链接触发浏览器下载
   *
   * @param href - 下载资源地址（Data URL 或 Blob URL）
   * @param fileName - 保存到本地时使用的文件名
   */
  function triggerDownload(href: string, fileName: string) {
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
  }

  /**
   * 下载 PNG 位图二维码
   */
  function handleDownloadPng() {
    if (!dataUrl) return;
    triggerDownload(dataUrl, 'qrcode.png');
  }

  /**
   * 将 SVG 字符串包装为 Blob 后下载矢量二维码
   */
  function handleDownloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'qrcode.svg');
    URL.revokeObjectURL(url);
  }

  /**
   * 将滑块或数字输入约束到允许的尺寸范围
   *
   * @param value - 用户输入的原始数值
   */
  function handleSizeChange(value: number) {
    if (Number.isNaN(value)) {
      setSize(SIZE_MIN);
      return;
    }
    setSize(Math.min(SIZE_MAX, Math.max(SIZE_MIN, value)));
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
          <QrCode className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          <span>{t('tools.qr.title')}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="qr-text"
            className="text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {t('tools.qr.contentLabel')}
          </label>
          <textarea
            id="qr-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('tools.qr.contentPlaceholder')}
            spellCheck={false}
            className="h-24 w-full resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 sm:text-sm"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!text}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t('tools.qr.charCount', { count: text.length })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('tools.qr.errorLevelLabel')}
          </span>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {QrErrorLevelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setErrorLevel(option.value)}
                className={
                  errorLevel === option.value
                    ? 'flex-1 rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'flex-1 rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              >
                {t(QrErrorLevelLabelKeyMap[option.value])}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(QrErrorLevelDescKeyMap[errorLevel])}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t('tools.qr.sizeLabel')}
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {t('tools.qr.sizeValue', { size })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={SIZE_MIN}
              max={SIZE_MAX}
              value={size}
              onChange={(event) => handleSizeChange(Number(event.target.value))}
              className="w-full cursor-pointer accent-slate-900 dark:accent-slate-100"
            />
            <input
              type="number"
              min={SIZE_MIN}
              max={SIZE_MAX}
              value={size}
              onChange={(event) => handleSizeChange(Number(event.target.value))}
              className="w-20 rounded-lg border border-slate-300 bg-white p-1.5 text-center text-xs font-mono text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('tools.qr.darkColorLabel')}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={darkColor}
              onChange={(event) => setDarkColor(event.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
            />
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {darkColor}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('tools.qr.lightColorLabel')}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={lightColor}
              onChange={(event) => setLightColor(event.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
            />
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {lightColor}
            </span>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!dataUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Download className="h-4 w-4" />
            {t('tools.qr.downloadPng')}
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!svg}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            {t('tools.qr.downloadSvg')}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
        <div className="flex min-h-[288px] w-full flex-1 items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs">{t('tools.qr.generating')}</span>
            </div>
          ) : errorMessage ? (
            <div className="flex max-w-sm flex-col items-center gap-2 text-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-8 w-8" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
              <img
                src={dataUrl}
                alt={t('tools.qr.previewAlt')}
                width={size}
                height={size}
                style={{ width: size, height: size }}
              />
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          {t('tools.qr.previewTip')}
        </p>
      </div>
    </div>
  );
}

export default QrGenerator;
