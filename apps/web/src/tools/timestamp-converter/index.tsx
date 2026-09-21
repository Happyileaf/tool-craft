'use client';

import { useEffect, useState } from 'react';
import { Check, Clock, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageEnum } from '@/lib/i18n/constants';
import {
  CLOCK_INTERVAL,
  TIMEZONE_CITIES,
} from './constants';
import {
  describeRelativeTime,
  formatZonedClock,
  parseDateToTimestamp,
  parseTimestampToDate,
} from './utils/timestamp';

/**
 * 时间戳转换工具页，包含实时时钟、时间戳与日期双向转换、多时区对照与相对时间描述，
 * 所有计算均在浏览器本地完成
 *
 * @returns 时间戳转换工具交互界面
 */
function TimestampConverter() {
  const { t, language } = useI18n();
  const locale = language === LanguageEnum.ZH ? 'zh-CN' : 'en-US';
  const [currentMilliseconds, setCurrentMilliseconds] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timestampInput, setTimestampInput] = useState(
    () => `${Math.floor(Date.now() / 1000)}`,
  );
  const [dateInput, setDateInput] = useState(() => {
    return new Date().toISOString().slice(0, 19);
  });

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setCurrentMilliseconds(Date.now());
    }, CLOCK_INTERVAL);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const dateResult = parseTimestampToDate(timestampInput, locale);
  const timestampResult = parseDateToTimestamp(dateInput);

  /**
   * 复制秒级时间戳并短暂展示成功反馈
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `${Math.floor(currentMilliseconds / 1000)}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 p-4 text-white shadow-xs dark:border dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 dark:bg-slate-900">
            <Clock className="h-5 w-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">
              {t('tools.timestamp.currentTimestamp')}
            </div>
            <div className="mt-0.5 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold tracking-wider text-emerald-400">
                {Math.floor(currentMilliseconds / 1000)}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {t('tools.timestamp.secondsLabel')}
              </span>
              <span className="font-mono text-xs text-slate-500">
                | {currentMilliseconds} {t('tools.timestamp.millisecondsLabel')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((previous) => !previous)}
            className={
              isPaused
                ? 'rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300'
                : 'rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700'
            }
          >
            {isPaused
              ? t('tools.timestamp.resume')
              : t('tools.timestamp.pause')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied
              ? t('tools.timestamp.copiedSeconds')
              : t('tools.timestamp.copySeconds')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
            <span>{t('tools.timestamp.toDateTime')}</span>
            <button
              type="button"
              onClick={() =>
                setTimestampInput(`${Math.floor(currentMilliseconds / 1000)}`)
              }
              className="text-[11px] text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {t('tools.timestamp.fillCurrent')}
            </button>
          </div>

          <input
            type="text"
            value={timestampInput}
            onChange={(event) => setTimestampInput(event.target.value)}
            placeholder={t('tools.timestamp.toDatePlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
          />

          {dateResult.success ? (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('tools.timestamp.localTime')}：
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dateResult.local}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('tools.timestamp.utcStandard')}：
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {dateResult.utc}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  ISO 8601：
                </span>
                <span className="break-all text-right text-slate-700 dark:text-slate-300">
                  {dateResult.iso}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded bg-rose-50 p-2 text-xs text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              {dateResult.errorMessage}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
            <span>{t('tools.timestamp.toTimestamp')}</span>
            <button
              type="button"
              onClick={() => setDateInput(new Date().toISOString().slice(0, 19))}
              className="text-[11px] text-slate-500 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {t('tools.timestamp.setCurrent')}
            </button>
          </div>

          <input
            type="datetime-local"
            step="1"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
          />

          {timestampResult.success ? (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('tools.timestamp.secondsValue')}：
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {timestampResult.seconds}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('tools.timestamp.millisecondsValue')}：
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {timestampResult.milliseconds}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('tools.timestamp.relativeTime')}：
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {describeRelativeTime(
                    timestampResult.milliseconds,
                    currentMilliseconds,
                    {
                      justNow: t('tools.timestamp.relative.justNow'),
                      shortly: t('tools.timestamp.relative.shortly'),
                      second: t('tools.timestamp.relative.second'),
                      minute: t('tools.timestamp.relative.minute'),
                      hour: t('tools.timestamp.relative.hour'),
                      day: t('tools.timestamp.relative.day'),
                      month: t('tools.timestamp.relative.month'),
                      year: t('tools.timestamp.relative.year'),
                      pastTemplate: t('tools.timestamp.relative.past'),
                      futureTemplate: t('tools.timestamp.relative.future'),
                    },
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded bg-rose-50 p-2 text-xs text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              {timestampResult.errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
          {t('tools.timestamp.timezone')}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {TIMEZONE_CITIES.map((city) => {
            const zoned = formatZonedClock(
              currentMilliseconds,
              city.timeZone,
              locale,
            );
            return (
              <div
                key={city.timeZone}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {t(city.labelKey)}
                </div>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                  {zoned.time}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {zoned.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimestampConverter;
