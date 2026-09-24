'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_LENGTH } from './constants';
import { generatePassword } from './utils/generate';

function PasswordGenerator() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    regenerate();
  }, []);

  function regenerate() {
    const newPassword = generatePassword(
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeSimilar
    );
    setPassword(newPassword);
  }

  async function handleCopy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const hasSelection =
    includeUppercase ||
    includeLowercase ||
    includeNumbers ||
    includeSymbols;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <label
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t('tools.password-generator.generatedPassword')}
          </label>
          <button
            type="button"
            onClick={regenerate}
            disabled={!hasSelection}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t('tools.password-generator.regenerate')}</span>
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 sm:flex-row sm:items-center">
          <span className="break-all select-all font-mono text-sm text-slate-700 dark:text-slate-300">
            {password || t('tools.password-generator.emptyPlaceholder')}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="mt-2 flex shrink-0 cursor-pointer items-center gap-1.5 self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:mt-0 sm:self-auto"
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
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.password-generator.passwordLength')}: {length}
          </label>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-48 accent-slate-900 dark:accent-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(event) => setIncludeUppercase(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {t('tools.password-generator.includeUppercase')} (A-Z)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(event) => setIncludeLowercase(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {t('tools.password-generator.includeLowercase')} (a-z)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(event) => setIncludeNumbers(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {t('tools.password-generator.includeNumbers')} (0-9)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(event) => setIncludeSymbols(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {t('tools.password-generator.includeSymbols')} (!@#$...)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 col-span-1 sm:col-span-2">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(event) => setExcludeSimilar(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {t('tools.password-generator.excludeSimilar')} (0, O, o, 1, I, l, i)
          </label>
        </div>

        {!hasSelection && (
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {t('tools.password-generator.selectAtLeastOne')}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.password-generator.localNotice')}
      </p>
    </div>
  );
}

export default PasswordGenerator;
