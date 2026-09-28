'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  PasswordStrength,
  PasswordStrengthLabels,
} from './constants';
import { checkPassword } from './utils/checker';

/**
 * 密码强度检测器，根据长度和字符多样性评估安全性，给出改进建议
 *
 * @returns 密码强度检测交互界面
 */
function PasswordStrengthChecker() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const result = checkPassword(password);
  const { strength, suggestions } = result;

  const strengthLabel = PasswordStrengthLabels[strength];

  // 进度条颜色和宽度
  const getBarStyle = () => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return {
          width: '33.3%',
          backgroundColor: 'rgb(239 68 68)',
        };
      case PasswordStrength.MEDIUM:
        return {
          width: '66.6%',
          backgroundColor: 'rgb(251 146 60)',
        };
      case PasswordStrength.STRONG:
        return {
          width: '100%',
          backgroundColor: 'rgb(34 197 94)',
        };
      default:
        return {
          width: '0%',
          backgroundColor: 'rgb(148 163 184)',
        };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Password input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('tools.passwordStrengthChecker.inputLabel')}
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('tools.passwordStrengthChecker.placeholder')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Strength bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.passwordStrengthChecker.strength')}:{' '}
              <span
                className={
                  strength === PasswordStrength.WEAK
                    ? 'text-red-500'
                    : strength === PasswordStrength.MEDIUM
                    ? 'text-orange-500'
                    : 'text-green-500'
                }
              >
                {t(
                  `tools.passwordStrengthChecker.${PasswordStrengthLabels[strength]}`,
                )}
              </span>
            </span>
            {password && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('tools.passwordStrengthChecker.length')}: {password.length}
              </span>
            )}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full transition-all duration-300"
              style={getBarStyle()}
            />
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('tools.passwordStrengthChecker.suggestions')}:
            </p>
            <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-400">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  {t(`tools.passwordStrengthChecker.${suggestion}`)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {password && strength === PasswordStrength.STRONG && suggestions.length === 0 && (
          <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('tools.passwordStrengthChecker.strongMessage')} 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordStrengthChecker;
