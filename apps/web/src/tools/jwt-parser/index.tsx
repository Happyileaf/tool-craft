'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Eraser, KeyRound, ShieldCheck, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageEnum } from '@/lib/i18n/constants';
import { DEFAULT_INPUT, JWT_CLAIM_LABELS, JWT_CLAIM_LABELS_EN } from './constants';
import { parseJwt, formatTimestamp, isExpired, type JwtParseResult } from './utils/parse';

function JwtParser() {
  const { t, language } = useI18n();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<JwtParseResult | null>(null);
  const [copied, setCopied] = useState<'header' | 'payload' | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setResult(null);
      return;
    }
    setResult(parseJwt(input));
  }, [input]);

  async function handleCopy(type: 'header' | 'payload') {
    if (!result) return;
    const content =
      type === 'header'
        ? JSON.stringify(result.header, null, 2)
        : JSON.stringify(result.payload, null, 2);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const claimLabels = language === LanguageEnum.ZH ? JWT_CLAIM_LABELS : JWT_CLAIM_LABELS_EN;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="jwt-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <KeyRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t('tools.jwt-parser.inputLabel')}
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
          id="jwt-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('tools.jwt-parser.inputPlaceholder')}
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.jwt-parser.localNotice')}
        </p>
      </div>

      {result && !result.isValidFormat && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          <X className="h-4 w-4" />
          {result.error}
        </div>
      )}

      {result && result.isValidFormat && (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                {t('tools.jwt-parser.header')}
              </div>
              <button
                type="button"
                onClick={() => handleCopy('header')}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {copied === 'header' ? (
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
              <pre className="break-all whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300">
                {JSON.stringify(result.header, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                {t('tools.jwt-parser.payload')}
              </div>
              <button
                type="button"
                onClick={() => handleCopy('payload')}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {copied === 'payload' ? (
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

            {result.payload && Object.keys(result.payload).some(key => ['exp', 'nbf', 'iat'].includes(key)) && (
              <div className="mb-2 flex flex-col gap-2">
                {Object.entries(result.payload)
                  .filter(([key]) => ['exp', 'nbf', 'iat'].includes(key))
                  .map(([key, value]) => {
                    if (typeof value !== 'number') return null;
                    const expired = key === 'exp' ? isExpired(value) : null;
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                          expired === true
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : expired === false
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-medium">{claimLabels[key] || key}:</span>
                        <span className="font-mono">{formatTimestamp(value as number)}</span>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <pre className="break-all whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              {t('tools.jwt-parser.signature')}
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300">
                {result.signature}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {t('tools.jwt-parser.signatureNote')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default JwtParser;
