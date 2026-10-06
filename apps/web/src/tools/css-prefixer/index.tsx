'use client';

import { useState, useEffect, useTransition } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SAMPLE_CSS } from './constants';
import { prefixCss, type PrefixOptions } from './utils/prefix';
import { ToolComponentProps } from '@/tools/types';

function CssPrefixer({ }: ToolComponentProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(DEFAULT_SAMPLE_CSS);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [browserQuery, setBrowserQuery] = useState('> 0.5%, last 2 versions, not dead');

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const options: PrefixOptions = {
      browsers: browserQuery
    };

    startTransition(async () => {
      try {
        const result = await prefixCss(input, options);
        setOutput(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setOutput('');
      }
    });
  }, [input, browserQuery]);

  const handleClear = () => {
    setInput('');
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="css-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('tools.cssPrefixer.inputLabel')}
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
          id="css-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('tools.cssPrefixer.inputPlaceholder')}
          spellCheck={false}
          className="h-36 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.cssPrefixer.browserQueryLabel')}
          </label>
          <input
            type="text"
            value={browserQuery}
            onChange={(e) => setBrowserQuery(e.target.value)}
            placeholder="e.g. > 1%, last 2 versions, Firefox ESR"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('tools.cssPrefixer.browserQueryHelp')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.cssPrefixer.outputLabel')}
            {isPending && <span className="text-xs text-slate-400">{t('common.processing')}</span>}
          </label>
          {output && (
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
        ) : output ? (
          <pre className="max-h-96 w-full overflow-auto rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm">
            {output}
          </pre>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            {isPending ? t('common.processing') : t('tools.cssPrefixer.emptyOutput')}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.cssPrefixer.localNotice')}
      </p>
    </div>
  );
}

export default CssPrefixer;
