'use client';

import { useState } from 'react';
import { Check, Copy, Eraser, Replace, Code } from 'lucide-react';
import { DEFAULT_INPUT } from './constants';
import { encodeHtml, decodeHtml } from './utils/codec';

/**
 * HTML 实体编解码工具，提供 HTML 实体的编码与解码功能
 * 全部运算在浏览器本地完成
 *
 * @returns HTML 实体编解码工具交互界面
 */
function HtmlEntityEncoderDecoder() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [encoded, setEncoded] = useState('');
  const [decoded, setDecoded] = useState('');
  const [copied, setCopied] = useState<'encoded' | 'decoded' | null>(null);

  const handleEncode = () => {
    const result = encodeHtml(input);
    setEncoded(result);
  };

  const handleDecode = () => {
    const result = decodeHtml(input);
    setDecoded(result);
  };

  const handleSwap = () => {
    if (encoded) {
      setInput(encoded);
      setEncoded('');
      setDecoded('');
    } else if (decoded) {
      setInput(decoded);
      setEncoded('');
      setDecoded('');
    }
  };

  const handleCopy = async (type: 'encoded' | 'decoded', value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setEncoded('');
    setDecoded('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="html-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Code className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            输入 HTML
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
        <textarea
          id="html-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setEncoded('');
            setDecoded('');
          }}
          placeholder="输入需要编解码的 HTML"
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleEncode}
            disabled={!input}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            编码 →
          </button>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!input || (encoded === '' && decoded === '')}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="交换输入和输出"
          >
            <Replace className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDecode}
            disabled={!input}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            ← 解码
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有编解码均在浏览器本地完成，数据不会上传到服务器。
        </p>
      </div>

      {encoded && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              编码结果
            </div>
            <button
              type="button"
              onClick={() => handleCopy('encoded', encoded)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied === 'encoded' ? (
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
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
              {encoded}
            </span>
          </div>
        </div>
      )}

      {decoded && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              解码结果
            </div>
            <button
              type="button"
              onClick={() => handleCopy('decoded', decoded)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied === 'decoded' ? (
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
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
              {decoded}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HtmlEntityEncoderDecoder;
