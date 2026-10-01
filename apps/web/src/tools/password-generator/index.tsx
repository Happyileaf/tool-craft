'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCcw, KeyRound } from 'lucide-react';
import { DEFAULT_LENGTH } from './constants';
import { generatePassword, calculateStrength, type PasswordOptions } from './utils/generate';

const strengthLabels = ['极弱', '弱', '中', '较强', '强', '非常强'];
const strengthColors = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-emerald-500',
];

/**
 * 安全随机密码生成器
 * 使用浏览器原生 Crypto API 生成，全部运算在本地完成
 *
 * @returns 密码生成工具交互界面
 */
function PasswordGenerator() {
  const [length, setLength] = useState(DEFAULT_LENGTH);
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

  const handleGenerate = () => {
    const newPassword = generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols,
    });
    setPassword(newPassword);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const strength = calculateStrength(password);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="password-output"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <KeyRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            生成的密码
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <RefreshCcw className="h-4 w-4" />
            重新生成
          </button>
        </div>
        <div className="flex gap-2">
          <input
            id="password-output"
            type="text"
            value={password}
            readOnly
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  复制成功
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
        {password && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">密码强度</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {strengthLabels[strength - 1] || strengthLabels[0]}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < strength ? strengthColors[strength - 1] : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="length-slider"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              密码长度: {length}
            </label>
          </div>
          <input
            id="length-slider"
            type="range"
            min="4"
            max="32"
            value={length}
            onChange={(event) => setLength(parseInt(event.target.value, 10))}
            className="w-full accent-slate-900 dark:accent-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(event) => setIncludeLowercase(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              a-z 小写字母
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(event) => setIncludeUppercase(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              A-Z 大写字母
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(event) => setIncludeNumbers(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">0-9 数字</span>
          </label>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(event) => setIncludeSymbols(event.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">!@# 特殊符号</span>
          </label>
        </div>

        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          所有密码使用浏览器原生 Crypto API 生成，本地完成，绝不传输到服务器。
        </p>
      </div>
    </div>
  );
}

export default PasswordGenerator;
