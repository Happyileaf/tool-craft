'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SAMPLE, REGEX_PATTERNS, FLAGS } from './constants';
import { generateRegex, type PatternKey } from './utils/generate';
import { ToolComponentProps } from '@/tools/types';

function RegexGenerator({ }: ToolComponentProps) {
  const { t } = useI18n();
  const [selectedPattern, setSelectedPattern] = useState<PatternKey>('email');
  const [customPattern, setCustomPattern] = useState('');
  const [text, setText] = useState(DEFAULT_SAMPLE);
  const [flags, setFlags] = useState<string[]>(['g', 'i']);
  const [generatedRegex, setGeneratedRegex] = useState<RegExp | null>(null);
  const [matches, setMatches] = useState<RegExpExecArray[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const pattern = customPattern || REGEX_PATTERNS[selectedPattern].pattern;
    try {
      const flagString = flags.join('');
      const regex = generateRegex(pattern, flagString);
      setGeneratedRegex(regex);

      // Find all matches in text
      if (!text.trim()) {
        setMatches([]);
        setError(null);
        return;
      }

      const foundMatches: RegExpExecArray[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        foundMatches.push(match);
        if (!regex.global) break;
      }

      setMatches(foundMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGeneratedRegex(null);
      setMatches([]);
    }
  }, [selectedPattern, customPattern, text, flags]);

  const toggleFlag = (key: string) => {
    if (flags.includes(key)) {
      setFlags(flags.filter(f => f !== key));
    } else {
      setFlags([...flags, key]);
    }
  };

  const handleCopy = async () => {
    if (!generatedRegex) return;
    try {
      await navigator.clipboard.writeText(`/${generatedRegex.source}/${generatedRegex.flags}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.regexGenerator.templateLabel')}
          </label>
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value as PatternKey)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 sm:text-sm"
          >
            {Object.entries(REGEX_PATTERNS).map(([key, data]) => (
              <option key={key} value={key}>
                {data.name} - {data.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('tools.regexGenerator.orCustom')}
          </p>
          <input
            type="text"
            value={customPattern}
            onChange={(e) => setCustomPattern(e.target.value)}
            placeholder={t('tools.regexGenerator.customPlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.regexGenerator.flagsLabel')}
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAGS.map(flag => (
              <label key={flag.key} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={flags.includes(flag.key)}
                  onChange={() => toggleFlag(flag.key)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
                />
                <span>{flag.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="regex-text-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('tools.regexGenerator.testTextLabel')}
          </label>
          <button
            type="button"
            onClick={handleClear}
            className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
          >
            <Eraser className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
        <textarea
          id="regex-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('tools.regexGenerator.testTextPlaceholder')}
          spellCheck={false}
          className="h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.regexGenerator.generatedLabel')}
            {generatedRegex && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                /{generatedRegex.source}/{generatedRegex.flags}
              </span>
            )}
          </label>
          {generatedRegex && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">{t('common.copySuccess')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{t('common.copy')}</span>
                </>
              )}
            </button>
          )}
        </div>
        {error ? (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-4 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('tools.regexGenerator.matchCount', { count: matches.length })}
            </p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              {matches.map((match, idx) => (
                <div key={idx} className="mb-2 last:mb-0 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {t('tools.regexGenerator.match')} #{idx + 1}:
                  </span>
                  <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {match[0]}
                  </code>
                  {match.groups && Object.keys(match.groups).length > 0 && (
                    <div className="pl-2">
                      {Object.entries(match.groups).map(([name, value]) => (
                        <div key={name} className="flex gap-2 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-500">{name}:</span>
                          <code className="font-mono text-slate-700 dark:text-slate-300">{value}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : text && !error ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            {t('tools.regexGenerator.noMatches')}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            {t('tools.regexGenerator.emptyOutput')}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.regexGenerator.localNotice')}
      </p>
    </div>
  );
}

export default RegexGenerator;
