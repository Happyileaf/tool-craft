'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import yaml from 'yaml';
import { DEFAULT_INPUT } from './constants';

function JsonToYaml() {
  const { t } = useI18n();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const yamlOutput = yaml.stringify(parsed);
      setOutput(yamlOutput);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input]);

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="json-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('tools.json-to-yaml.inputLabel')}
          </label>
          <button
            type="button"
            onClick={() => setInput('')}
            className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
          >
            <Eraser className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
        <textarea
          id="json-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('tools.json-to-yaml.inputPlaceholder')}
          spellCheck={false}
          className="h-36 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.json-to-yaml.localNotice')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      {output && !error && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('tools.json-to-yaml.outputLabel')}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{t('common.copy')}</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonToYaml;
