'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Key, ShieldCheck, ShieldX } from 'lucide-react';
import { ToolComponentProps } from '@/types/tool';
import JSONFormatter from '@/components/JSONFormatter';
import { parseJwt, generateJwt, verifySignature, ParseResult, JWTParts } from './utils/jwt';

const DEFAULT_SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

function JwtParser({ defaultSampleInput = DEFAULT_SAMPLE }: ToolComponentProps) {
  const [token, setToken] = useState(defaultSampleInput);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [secret, setSecret] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!token.trim()) {
      setParseResult(null);
      setIsVerified(null);
      return;
    }

    const result = parseJwt(token.trim());
    setParseResult(result);
    setIsVerified(null);
  }, [token]);

  const handleVerify = async () => {
    if (!parseResult?.success || !secret) return;
    const valid = await verifySignature(token, secret);
    setIsVerified(valid);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            JWT Token
          </label>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!token}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="粘贴 JWT token 在此处..."
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有操作均在浏览器本地完成，Token 不会上传至服务器。
        </p>
      </div>

      {parseResult && !parseResult.success && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/30 dark:bg-rose-900/20">
          <ShieldX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
            {parseResult.error}
          </span>
        </div>
      )}

      {parseResult?.success && parseResult.parts && (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Header
            </h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <JSONFormatter data={parseResult.parts.headerJson} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payload
            </h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <JSONFormatter data={parseResult.parts.payloadJson} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              签名验证
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="输入密钥验证签名..."
                spellCheck={false}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={!secret || !token}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 sm:w-auto"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                验证签名
              </button>
            </div>
            {isVerified !== null && (
              <div className={`flex items-center gap-2 rounded-lg p-3 ${
                isVerified
                  ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
                  : 'bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/30'
              }`}>
                {isVerified ? (
                  <>
                    <ShieldCheck className={`h-4 w-4 ${
                      isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      isVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}>
                      签名验证通过，密钥正确。
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldX className={`h-4 w-4 ${
                      isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      isVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}>
                      签名验证失败，密钥不正确或 Token 被篡改。
                    </span>
                  </>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              当前仅支持 HS256 (HMAC-SHA256) 算法签名验证。
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default JwtParser;
