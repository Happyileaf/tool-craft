'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Code } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_PATTERN,
  DEFAULT_TEST_TEXT,
  MAX_MATCH_COUNT,
  REGEX_PRESETS,
  RegexFlagEnum,
  RegexFlagLabelKeyMap,
} from './constants';
import { matchRegex, replaceWithRegex } from './utils/regex-match';

/**
 * 正则表达式测试工具页，支持修饰符切换、常用预设、捕获组展示与文本替换，
 * 全部匹配过程在浏览器本地实时完成
 *
 * @returns 正则测试工具交互界面
 */
function RegexTester() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [enabledFlags, setEnabledFlags] = useState<Set<RegexFlagEnum>>(
    () => new Set([RegexFlagEnum.GLOBAL, RegexFlagEnum.IGNORE_CASE]),
  );
  const [testText, setTestText] = useState(DEFAULT_TEST_TEXT);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [replacement, setReplacement] = useState('');

  const flagString = useMemo(() => {
    return Object.values(RegexFlagEnum)
      .filter((flag) => enabledFlags.has(flag))
      .join('');
  }, [enabledFlags]);

  const matchResult = useMemo(
    () => matchRegex(pattern, flagString, testText),
    [pattern, flagString, testText],
  );

  const replacementResult = useMemo(() => {
    if (!isReplaceMode) return null;
    return replaceWithRegex(testText, pattern, flagString, replacement);
  }, [isReplaceMode, testText, pattern, flagString, replacement]);

  const errorMessage =
    matchResult.errorMessage ?? replacementResult?.errorMessage ?? null;

  /**
   * 切换某个正则修饰符的启用状态
   *
   * @param flag - 目标修饰符
   */
  function toggleFlag(flag: RegexFlagEnum) {
    setEnabledFlags((previous) => {
      const next = new Set(previous);
      if (next.has(flag)) {
        next.delete(flag);
      } else {
        next.add(flag);
      }
      return next;
    });
  }

  const flags = Object.values(RegexFlagEnum);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="regex-pattern-input"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Code className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t('tools.regex.patternLabel')}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('tools.regex.flagsLabel')}：
            </span>
            {flags.map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => toggleFlag(flag)}
                title={t(RegexFlagLabelKeyMap[flag])}
                className={
                  enabledFlags.has(flag)
                    ? 'rounded border border-slate-900 bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xs focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-slate-400 dark:focus-within:ring-slate-400">
          <span className="select-none px-3 font-mono text-base font-bold text-slate-400 dark:text-slate-500">
            /
          </span>
          <input
            id="regex-pattern-input"
            type="text"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder={t('tools.regex.patternPlaceholder')}
            spellCheck={false}
            className="w-full border-0 bg-transparent px-1 py-2.5 font-mono text-sm text-slate-900 focus:outline-none focus:ring-0 dark:text-white sm:text-base"
          />
          <span className="select-none px-3 font-mono text-base font-bold text-slate-400 dark:text-slate-500">
            /{flagString}
          </span>
        </div>

        {errorMessage ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">
            {t('tools.regex.commonPresets')}：
          </span>
          {REGEX_PRESETS.map((preset) => (
            <button
              key={preset.labelKey}
              type="button"
              onClick={() => setPattern(preset.pattern)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsReplaceMode(false)}
          className={
            !isReplaceMode
              ? 'rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'
              : 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }
        >
          {t('tools.regex.matchMode')}
        </button>
        <button
          type="button"
          onClick={() => setIsReplaceMode(true)}
          className={
            isReplaceMode
              ? 'rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'
              : 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }
        >
          {t('tools.regex.replaceMode')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span>{t('tools.regex.testTextLabel')}</span>
            <span className="text-slate-400 dark:text-slate-500">
              {testText.length}
            </span>
          </div>
          <textarea
            value={testText}
            onChange={(event) => setTestText(event.target.value)}
            placeholder={t('tools.regex.testTextPlaceholder')}
            spellCheck={false}
            className="min-h-[300px] w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600 sm:text-sm"
          />
        </div>

        {isReplaceMode ? (
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
              {t('tools.regex.replaceResult')}
            </div>
            <div className="border-b border-slate-200 p-3 dark:border-slate-800">
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">
                {t('tools.regex.replacementString')}
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                placeholder={t('tools.regex.replacementPlaceholder')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>
            <div className="min-h-[240px] flex-1 whitespace-pre-wrap break-all p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 sm:text-sm">
              {replacementResult?.output}
            </div>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white">
                {t('tools.regex.matchesFound', {
                  count: matchResult.matches.length,
                })}
              </span>
            </div>

            <div className="max-h-[340px] flex-1 overflow-y-auto p-4">
              {matchResult.truncated ? (
                <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {t('tools.regex.truncatedNotice', {
                    count: MAX_MATCH_COUNT,
                  })}
                </p>
              ) : null}
              {matchResult.matches.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-xs text-slate-400 dark:text-slate-500">
                  <p>{t('tools.regex.noMatches')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {matchResult.matches.map((item, index) => (
                    <div
                      key={`${item.index}-${index}`}
                      className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                          {t('tools.regex.matchValue', {
                            index: index + 1,
                          })}
                          ：{item.match}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {t('tools.regex.charIndex', { index: item.index })}
                        </span>
                      </div>

                      {item.groups.length > 0 ? (
                        <div className="mt-1 grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-1.5 sm:grid-cols-2 dark:border-slate-800">
                          {item.groups.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="rounded border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/80"
                            >
                              <span className="mr-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                {t('tools.regex.groupLabel', {
                                  index: groupIndex + 1,
                                })}
                                ：
                              </span>
                              <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                {group || t('tools.regex.emptyGroup')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegexTester;
