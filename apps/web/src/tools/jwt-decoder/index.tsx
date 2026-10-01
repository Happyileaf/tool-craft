'use client';

import { useState } from 'react';
import { Check, Copy, Eraser, Key } from 'lucide-react';
import { DEFAULT_INPUT } from './constants';
import { decodeJwt, type JwtResult } from './utils/decode';

/**
 * JWT 解码工具，解析 JWT token 的头部和 payload
 * 全部运算在浏览器本地完成
 *
 * @returns JWT 解码工具交互界面
 */
function JwtDecoder() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<JwtResult>({
    header: null,
    payload: null,
    signature: null,
    error: null,
  });
  const [copied, setCopied] = useState<'header' | 'payload' | null>(null);

  const handleDecode = () => {
    const decoded = decodeJwt(input.trim());
    setResult(decoded);
  };

  const handleCopy = async (type: 'header' | 'payload', value: string) => {
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
    setResult({
      header: null,
      payload: null,
      signature: null,
      error: null,
    });
  };

  const formatJson = (obj: Record<string, unknown>): string => {
    return JSON.stringify(obj, null, 2);
  };

  function formatUnixTimestamp(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleString()} (UTC: ${date.toUTCString()})`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="jwt-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            JWT Token
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
          id="jwt-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          placeholder="粘贴你的 JWT token 在此"
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleDecode}
            disabled={!input.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            解码
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有解码均在浏览器本地完成，token 不会上传到服务器。
        </p>
      </div>

      {result.error && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-xs dark:border-rose-800 dark:bg-rose-900/20">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
            错误: {result.error}
          </div>
        </div>
      )}

      {result.header && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Header
            </div>
            <button
              type="button"
              onClick={() => handleCopy('header', formatJson(result.header!))}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied === 'header' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    复制成功
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>复制 JSON</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {formatJson(result.header)}
            </pre>
          </div>
        </div>
      )}

      {result.payload && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payload
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy('payload', formatJson(result.payload!))
              }
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied === 'payload' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    复制成功
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>复制 JSON</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {formatJson(result.payload)}
            </pre>
            {result.payload.exp && (
              <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <span className="font-semibold">Expires at:</span>{' '}
                {formatUnixTimestamp(result.payload.exp)}
                {Date.now() / 1000 > result.payload.exp && (
                  <span className="ml-2 rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                    Expired
                  </span>
                )}
              </div>
            )}
            {result.payload.iat && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Issued at:</span>{' '}
                {formatUnixTimestamp(result.payload.iat)}
              </div>
            )}
            {result.payload.nbf && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Not valid before:</span>{' '}
                {formatUnixTimestamp(result.payload.nbf)}
              </div>
            )}
          </div>
        </div>
      )}

      {result.signature && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Signature
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {result.signature}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default JwtDecoder;
