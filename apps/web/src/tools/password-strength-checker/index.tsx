'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { checkPasswordStrength, PasswordStrength, CheckResult } from './utils/check';

const strengthLabels = ['弱', '中', '强'];
const strengthColors = {
  [PasswordStrength.WEAK]: 'bg-rose-500',
  [PasswordStrength.MEDIUM]: 'bg-amber-500',
  [PasswordStrength.STRONG]: 'bg-emerald-500',
};
const strengthIcons = {
  [PasswordStrength.WEAK]: ShieldAlert,
  [PasswordStrength.MEDIUM]: ShieldQuestion,
  [PasswordStrength.STRONG]: ShieldCheck,
};

function PasswordStrengthChecker({ defaultInput }: ToolComponentProps) {
  const [password, setPassword] = useState(defaultInput || '');
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    if (!password) {
      setResult(null);
      return;
    }
    const checkResult = checkPasswordStrength(password);
    setResult(checkResult);
  }, [password]);

  const getPercentage = () => {
    if (!result) return 0;
    return Math.min(100, (result.score / 6) * 100);
  };

  const StrengthIcon = result ? strengthIcons[result.strength] : ShieldQuestion;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            输入密码检查强度
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="在此输入密码..."
            spellCheck={false}
            autoComplete="off"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有检查均在浏览器本地完成，密码不会上传至任何服务器，请放心使用。
        </p>
      </div>

      {result && (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StrengthIcon className={`h-5 w-5 ${
                  result.strength === PasswordStrength.WEAK
                    ? 'text-rose-500'
                    : result.strength === PasswordStrength.MEDIUM
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  强度：{strengthLabels[result.strength]}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                分数：{result.score}/6
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all duration-300 ${strengthColors[result.strength]}`}
                style={{ width: `${getPercentage()}%` }}
              />
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
              <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                改进建议
              </h4>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-xs text-amber-700 dark:text-amber-300 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-600 dark:before:text-amber-400"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.strength === PasswordStrength.STRONG && result.suggestions.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/30 dark:bg-emerald-900/20">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                您的密码强度符合安全要求，满足大多数场景的安全标准。
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PasswordStrengthChecker;
