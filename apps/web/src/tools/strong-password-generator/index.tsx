'use client';

import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Check, Key, Eraser } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { generatePassword } from './utils/generate';

const DEFAULT_PASSWORD_LENGTH = 16;

function StrongPasswordGenerator({ defaultInput }: ToolComponentProps) {
  const [password, setPassword] = useState(defaultInput || '');
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const regenerate = useCallback(() => {
    const newPassword = generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeDigits,
      includeSymbols,
    });
    setPassword(newPassword);
    setIsCopied(false);
  }, [length, includeLowercase, includeUppercase, includeDigits, includeSymbols]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  const handleClear = () => {
    setPassword('');
    setIsCopied(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            生成的密码
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Eraser className="h-3.5 w-3.5" />
              清空
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="点击生成按钮生成密码"
            spellCheck={false}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有密码均在浏览器本地生成，绝不上传至任何服务器。
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              密码长度: {length}
            </label>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => {
              setLength(parseInt(e.target.value, 10));
              setIsCopied(false);
            }}
            className="w-full accent-slate-900 dark:accent-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => {
                setIncludeLowercase(e.target.checked);
                setIsCopied(false);
              }}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            小写字母 (a-z)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => {
                setIncludeUppercase(e.target.checked);
                setIsCopied(false);
              }}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            大写字母 (A-Z)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={includeDigits}
              onChange={(e) => {
                setIncludeDigits(e.target.checked);
                setIsCopied(false);
              }}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            数字 (0-9)
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => {
                setIncludeSymbols(e.target.checked);
                setIsCopied(false);
              }}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            特殊符号 (!@#$%...)
          </label>
        </div>

        <button
          type="button"
          onClick={regenerate}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          重新生成
        </button>
      </div>
    </div>
  );
}

export default StrongPasswordGenerator;
