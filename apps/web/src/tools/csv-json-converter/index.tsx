'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Eraser, ArrowLeftRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SAMPLE_CSV, DEFAULT_SAMPLE_JSON } from './constants';
import { csvToJson, jsonToCsv, type ConvertDirection, type ConvertOptions } from './utils/convert';
import { ToolComponentProps } from '@/tools/types';

function CsvJsonConverter({ }: ToolComponentProps) {
  const { t } = useI18n();
  const [direction, setDirection] = useState<ConvertDirection>('csv-to-json');
  const [input, setInput] = useState(DEFAULT_SAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ConvertOptions>({
    delimiter: 'auto',
    newline: 'auto'
  });

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let result: string;
      if (direction === 'csv-to-json') {
        result = csvToJson(input, options);
      } else {
        result = jsonToCsv(input, options);
      }
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutput('');
    }
  }, [input, direction, options]);

  const toggleDirection = () => {
    setDirection(prev => prev === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setInput(output);
    setOutput(input);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <ArrowLeftRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {direction === 'csv-to-json' ? t('tools.csvJsonConverter.directionCsvToJson') : t('tools.csvJsonConverter.directionJsonToCsv')}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDirection}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            {t('tools.csvJsonConverter.swapDirection')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
          >
            <Eraser className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <label
            htmlFor="csv-json-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {direction === 'csv-to-json' ? t('tools.csvJsonConverter.inputCsv') : t('tools.csvJsonConverter.inputJson')}
          </label>
          <textarea
            id="csv-json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'csv-to-json' ? t('tools.csvJsonConverter.placeholderCsv') : t('tools.csvJsonConverter.placeholderJson')}
            spellCheck={false}
            className="h-64 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {direction === 'csv-to-json' ? t('tools.csvJsonConverter.outputJson') : t('tools.csvJsonConverter.outputCsv')}
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
            <pre className="h-64 w-full overflow-auto rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm">
              {output}
            </pre>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              {t('tools.csvJsonConverter.emptyOutput')}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.csvJsonConverter.localNotice')}
      </p>
    </div>
  );
}

export default CsvJsonConverter;
