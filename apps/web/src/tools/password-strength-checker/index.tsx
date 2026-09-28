'use client';

import { useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PasswordStrength, PasswordStrengthLabels } from './constants';
import { checkPassword } from './utils/checker';

const strengthStyles: Record<
  PasswordStrength,
  {
    badge: string;
    dot: string;
    segment: string;
  }
> = {
  [PasswordStrength.WEAK]: {
    badge:
      'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-400',
    dot: 'bg-rose-500',
    segment: 'bg-rose-500',
  },
  [PasswordStrength.MEDIUM]: {
    badge:
      'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-400',
    dot: 'bg-amber-500',
    segment: 'bg-amber-500',
  },
  [PasswordStrength.STRONG]: {
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    segment: 'bg-emerald-500',
  },
};

/**
 * 密码强度检测器，根据长度和字符多样性评估安全性，给出改进建议
 *
 * @returns 密码强度检测交互界面
 */
function PasswordStrengthChecker() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const result = checkPassword(password);
  const { strength, suggestions } = result;

  const styles = strengthStyles[strength];
  const filledSegments = strength + 1;
  const isEmpty = password.length === 0;
  const isStrong = strength === PasswordStrength.STRONG && suggestions.length === 0;

  async function handleCopy() {
    if (!password) {
      return;
    }
    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <span>{t('tools.passwordStrengthChecker.inputLabel')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className={cn(
                'flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-default dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
                !password && 'invisible',
              )}
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
                  {t('common.copy')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPassword('')}
              disabled={!password}
              className={cn(
                'flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-default dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
                !password && 'invisible',
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('common.clear')}
            </button>
          </div>
        </div>
        <div className="px-4 py-3">
          <input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('tools.passwordStrengthChecker.placeholder')}
            className="w-full bg-transparent font-mono text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
          <span>
            {t('tools.passwordStrengthChecker.length')}：{password.length}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {t('common.clientSideExecution')}
          </span>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <span>{t('tools.passwordStrengthChecker.strength')}</span>
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
              styles.badge,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
            {t(
              `tools.passwordStrengthChecker.${PasswordStrengthLabels[strength]}`,
            )}
          </span>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((segment) => (
              <div
                key={segment}
                className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800"
              >
                {!isEmpty && segment < filledSegments && (
                  <div
                    className={cn('h-full rounded-full', styles.segment)}
                  />
                )}
              </div>
            ))}
          </div>

          {isEmpty ? (
            <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
              {t(`tools.passwordStrengthChecker.${suggestions[0]}`)}
            </p>
          ) : isStrong ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t('tools.passwordStrengthChecker.strongMessage')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t('tools.passwordStrengthChecker.suggestions')}
              </p>
              <ul className="flex flex-col gap-1.5">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {t(`tools.passwordStrengthChecker.${suggestion}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordStrengthChecker;
