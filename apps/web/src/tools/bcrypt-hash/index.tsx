'use client';

import { useState } from 'react';
import { Copy, Check, ShieldCheck, KeyRound } from 'lucide-react';
import { ToolComponentProps } from '@/types/tool';
import { hashPassword, verifyPassword } from './utils/bcrypt';

function BcryptHash({ defaultSampleInput }: ToolComponentProps) {
  const [password, setPassword] = useState(defaultSampleInput || '');
  const [costFactor, setCostFactor] = useState(10);
  const [hash, setHash] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isHashCopied, setIsHashCopied] = useState(false);

  const handleHash = async () => {
    if (!password) {
      setHash('');
      return;
    }
    setIsHashing(true);
    try {
      const result = await hashPassword({ password, costFactor });
      setHash(result);
    } catch (e) {
      setHash('生成失败');
    } finally {
      setIsHashing(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyPassword || !hash) {
      setVerifyResult(null);
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyPassword({ password: verifyPassword, hash });
      setVerifyResult(result);
    } catch {
      setVerifyResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setIsHashCopied(true);
      setTimeout(() => setIsHashCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <KeyRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            原始密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入需要加密的密码..."
            spellCheck={false}
            autoComplete="off"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cost Factor (cost): {costFactor}
            </label>
          </div>
          <input
            type="range"
            min="4"
            max="16"
            value={costFactor}
            onChange={(e) => setCostFactor(parseInt(e.target.value, 10))}
            className="w-full accent-slate-900 dark:accent-slate-300"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            值越大，加密越安全，但计算速度越慢。常见范围 10~12。
          </p>
        </div>
        <button
          type="button"
          onClick={handleHash}
          disabled={!password || isHashing}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <ShieldCheck className="h-4 w-4" />
          {isHashing ? '生成中...' : '生成 BCrypt 哈希'}
        </button>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有计算都在浏览器本地完成，密码不会上传至服务器。
        </p>
      </div>

      {hash && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              BCrypt 哈希结果
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isHashCopied ? (
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
          <div className="break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:text-sm">
            {hash}
          </div>
        </div>
      )}

      {hash && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            验证密码匹配
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => {
                setVerifyPassword(e.target.value);
                setVerifyResult(null);
              }}
              placeholder="输入密码验证是否匹配..."
              spellCheck={false}
              autoComplete="off"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={!verifyPassword || isVerifying}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isVerifying ? '验证中...' : '验证'}
            </button>
          </div>
          {verifyResult !== null && (
            <div className={`flex items-center gap-2 rounded-lg p-3 ${
              verifyResult
                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
                : 'bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/30'
            }`}>
              {verifyResult ? (
                <>
                  <ShieldCheck className={`h-4 w-4 text-emerald-600 dark:text-emerald-400`} />
                  <span className={`text-xs font-medium text-emerald-700 dark:text-emerald-300`}>
                    密码匹配，验证通过。
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className={`h-4 w-4 text-rose-600 dark:text-rose-400`} />
                  <span className={`text-xs font-medium text-rose-700 dark:text-rose-300`}>
                    密码不匹配，验证失败。
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BcryptHash;
