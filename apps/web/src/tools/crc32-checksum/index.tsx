'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Hash } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { computeCRC32 } from './utils/crc32';

function CRC32Checksum({ defaultInput = 'The quick brown fox jumps over the lazy dog' }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput);
  const [result, setResult] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!input) {
      setResult('');
      return;
    }
    setResult(computeCRC32(input));
  }, [input]);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Hash className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            输入文本
          </label>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入需要计算 CRC32 校验和的文本..."
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有计算均在浏览器本地完成，输入数据不会上传至服务器。
        </p>
      </div>

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              CRC32 校验和（十六进制）
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
          <div className="break-all rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

export default CRC32Checksum;
