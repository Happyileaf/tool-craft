'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from './constants';
import { generatePassword } from './utils/generator';

/**
 * 强密码生成器工具页，支持自定义长度和字符类型选择，
 * 全部运算在浏览器本地完成，使用原生 crypto API 保证随机性
 *
 * @returns 强密码生成器交互界面
 */
function StrongPasswordGenerator() {
  const { t } = useI18n();
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState(() =>
    generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols,
    }),
  );
  const [copied, setCopied] = useState(false);

  function regenerate() {
    const newPassword = generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols,
    });
    setPassword(newPassword);
    setCopied(false);
  }

  async function handleCopy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败不需要特殊处理
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Password display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-lg dark:border-slate-700 dark:bg-slate-800">
            {password}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            title={t('common.copyResult')}
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            )}
          </button>
          <button
            type="button"
            onClick={regenerate}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            title={t('common.regenerate')}
          >
            <RefreshCw className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Length slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.strongPasswordGenerator.length')} ({length})
            </label>
          </div>
          <input
            type="range"
            min={MIN_PASSWORD_LENGTH}
            max={MAX_PASSWORD_LENGTH}
            value={length}
            onChange={(e) => {
              setLength(parseInt(e.target.value, 10));
            }}
            onMouseUp={regenerate}
            onTouchEnd={regenerate}
            className="w-full accent-slate-900 dark:accent-slate-100"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{MIN_PASSWORD_LENGTH}</span>
            <span>{MAX_PASSWORD_LENGTH}</span>
          </div>
        </div>

        {/* Character options */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => {
                setIncludeLowercase(e.target.checked);
                regenerate();
              }}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t('tools.strongPasswordGenerator.lowercase')} (a-z)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => {
                setIncludeUppercase(e.target.checked);
                regenerate();
              }}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t('tools.strongPasswordGenerator.uppercase')} (A-Z)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => {
                setIncludeNumbers(e.target.checked);
                regenerate();
              }}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t('tools.strongPasswordGenerator.numbers')} (0-9)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => {
                setIncludeSymbols(e.target.checked);
                regenerate();
              }}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t('tools.strongPasswordGenerator.symbols')} (!@#$...)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default StrongPasswordGenerator;
