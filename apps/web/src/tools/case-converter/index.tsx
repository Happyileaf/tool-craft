'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_INPUT, CaseType } from './constants';
import { convertCase } from './utils/convert';

function CaseConverter() {
  const { t } = useI18n();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [targetCase, setTargetCase] = useState<CaseType>(CaseType.CAMEL);
  const [copied, setCopied] = useState(false);

  const result = convertCase(input, targetCase);

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const caseOptions = [
    { value: CaseType.CAMEL, label: t('tools.case-converter.camelCase') },
    { value: CaseType.PASCAL, label: t('tools.case-converter.pascalCase') },
    { value: CaseType.SNAKE, label: t('tools.case-converter.snakeCase') },
    { value: CaseType.KEBAB, label: t('tools.case-converter.kebabCase') },
    { value: CaseType.CONSTANT, label: t('tools.case-converter.constantCase') },
    { value: CaseType.SENTENCE, label: t('tools.case-converter.sentenceCase') },
    { value: CaseType.TITLE, label: t('tools.case-converter.titleCase') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <label
          htmlFor="case-input"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {t('tools.case-converter.inputLabel')}
        </label>
        <textarea
          id="case-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('tools.case-converter.inputPlaceholder')}
          spellCheck={false}
          className="h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.case-converter.localNotice')}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('tools.case-converter.targetFormat')}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {caseOptions.map(option => (
            <label
              key={option.value}
              className={`flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                targetCase === option.value
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <input
                type="radio"
                name="targetCase"
                value={option.value}
                checked={targetCase === option.value}
                onChange={() => setTargetCase(option.value as CaseType)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.case-converter.result')}
          </label>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
            {result}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CaseConverter;
