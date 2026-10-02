'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SAMPLE_INPUT, PasswordStrengthEnum, StrengthConfig } from './constants';
import { checkPasswordStrength } from './utils/checker';

/**
 * 密码强度检测工具，实时分析密码安全性并给出改进建议，全部运算本地完成。
 * @returns 密码强度检测工具界面
 */
function PasswordStrengthChecker() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(checkPasswordStrength(''));

  useEffect(() => {
    const checkResult = checkPasswordStrength(password);
    setResult(checkResult);
  }, [password]);

  const strength = result.strength;
  const config = StrengthConfig[strength];
  const progressPercent = Math.min((result.score / 6) * 100, 100);

  // 获取对应强度图标
  const StrengthIcon =
    strength === PasswordStrengthEnum.WEAK
      ? ShieldAlert
      : strength === PasswordStrengthEnum.MEDIUM
        ? Shield
        : ShieldCheck;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <StrengthIcon className={`h-4 w-4 ${config.textClass}`} />
          {t('tools.password-strength-checker.title')}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('tools.password-strength-checker.inputPlaceholder')}
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
          />
        </div>

        {password.length > 0 && (
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t('tools.password-strength-checker.strengthLabel')}:{' '}
                  <span className={config.textClass}>
                    {result.strength === PasswordStrengthEnum.WEAK
                      ? t('tools.password-strength-checker.weak')
                      : result.strength === PasswordStrengthEnum.MEDIUM
                        ? t('tools.password-strength-checker.medium')
                        : t('tools.password-strength-checker.strong')}
                  </span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('tools.password-strength-checker.lengthLabel')}: {password.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full transition-all duration-300 ${config.colorClass}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {result.suggestions.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg bg-white p-3 dark:bg-slate-800">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.password-strength-checker.suggestionsLabel')}:
                </span>
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.strength === PasswordStrengthEnum.STRONG && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {t('tools.password-strength-checker.strongMessage')}
              </div>
            )}
          </div>
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.password-strength-checker.localNotice')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          className={`rounded-md border p-2 text-center text-xs ${
            result.hasLower
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {t('tools.password-strength-checker.hasLower')}
        </div>
        <div
          className={`rounded-md border p-2 text-center text-xs ${
            result.hasUpper
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {t('tools.password-strength-checker.hasUpper')}
        </div>
        <div
          className={`rounded-md border p-2 text-center text-xs ${
            result.hasDigit
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {t('tools.password-strength-checker.hasDigit')}
        </div>
        <div
          className={`rounded-md border p-2 text-center text-xs ${
            result.hasSymbol
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {t('tools.password-strength-checker.hasSymbol')}
        </div>
      </div>
    </div>
  );
}

export default PasswordStrengthChecker;
