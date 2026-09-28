'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Mode, MIN_ROUNDS, MAX_ROUNDS, DEFAULT_ROUNDS } from './constants';

/**
 * BCrypt 密码哈希生成与验证工具，支持自定义 cost factor (rounds)
 *
 * @returns BCrypt 工具交互界面
 */
function BCryptHash() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(Mode.HASH);
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [hash, setHash] = useState('');
  const [passwordToVerify, setPasswordToVerify] = useState('');
  const [hashToVerify, setHashToVerify] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * 依据当前密码与计算成本生成哈希，未输入密码时不执行
   */
  function handleGenerate() {
    if (!password) return;
    const salt = bcrypt.genSaltSync(rounds);
    setHash(bcrypt.hashSync(password, salt));
    setCopied(false);
  }

  function doVerify() {
    if (!passwordToVerify || !hashToVerify) {
      setVerifyResult(null);
      return;
    }
    setVerifyResult(bcrypt.compareSync(passwordToVerify, hashToVerify));
  }

  async function handleCopy() {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  /**
   * 切换哈希生成与验证模式，同时清空两个模式下的输入与结果
   *
   * @param nextMode - 目标模式
   */
  function switchMode(nextMode: Mode) {
    if (mode === nextMode) return;
    setPassword('');
    setRounds(DEFAULT_ROUNDS);
    setHash('');
    setPasswordToVerify('');
    setHashToVerify('');
    setVerifyResult(null);
    setCopied(false);
    setMode(nextMode);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => switchMode(Mode.HASH)}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              mode === Mode.HASH
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {t('tools.bcrypt.hashMode')}
          </button>
          <button
            type="button"
            onClick={() => switchMode(Mode.VERIFY)}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              mode === Mode.VERIFY
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {t('tools.bcrypt.verifyMode')}
          </button>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-emerald-600 sm:flex dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('common.clientSideExecution')}
        </span>
      </div>

      {mode === Mode.HASH && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                {t('tools.bcrypt.costFactor')}：
                <span className="inline-block w-5 tabular-nums">{rounds}</span>
              </span>
              <input
                type="range"
                min={MIN_ROUNDS}
                max={MAX_ROUNDS}
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
                className="w-48 shrink-0 cursor-pointer accent-slate-900 dark:accent-slate-100"
              />
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t('tools.bcrypt.costFactorHint')}
            </span>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              {t('tools.bcrypt.passwordToHash')}
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('tools.bcrypt.passwordPlaceholder')}
                className="w-full bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <span>{t('tools.bcrypt.generatedHash')}</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[11px] text-slate-400 dark:text-slate-500',
                    !hash && 'invisible',
                  )}
                >
                  {t('tools.bcrypt.hashLength')}：{hash.length}
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!password}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  {t('tools.bcrypt.generate')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!hash}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t('common.copySuccess')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      {t('common.copy')}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex min-h-[72px] items-center bg-slate-900 p-4 dark:bg-slate-950">
              {hash ? (
                <p className="break-all font-mono text-xs leading-relaxed text-emerald-400">
                  {hash}
                </p>
              ) : (
                <p className="w-full text-center font-mono text-xs text-slate-500">
                  {t('tools.bcrypt.emptyResult')}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {mode === Mode.VERIFY && (
        <>
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              {t('tools.bcrypt.passwordToVerify')}
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                value={passwordToVerify}
                onChange={(event) => {
                  setPasswordToVerify(event.target.value);
                  setVerifyResult(null);
                }}
                placeholder={t('tools.bcrypt.passwordPlaceholderVerify')}
                className="w-full bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <span>{t('tools.bcrypt.hashToVerify')}</span>
              <span
                aria-hidden={verifyResult === null}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity',
                  verifyResult === null
                    ? 'border-transparent opacity-0'
                    : verifyResult
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-400',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    verifyResult === null
                      ? 'bg-transparent'
                      : verifyResult
                        ? 'bg-emerald-500'
                        : 'bg-rose-500',
                  )}
                />
                {verifyResult === null
                  ? t('tools.bcrypt.notMatch')
                  : verifyResult
                    ? t('tools.bcrypt.match')
                    : t('tools.bcrypt.notMatch')}
              </span>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={hashToVerify}
                onChange={(event) => {
                  setHashToVerify(event.target.value);
                  setVerifyResult(null);
                }}
                placeholder={t('tools.bcrypt.hashPlaceholder')}
                className="min-h-[88px] w-full resize-y bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
              />
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={doVerify}
                disabled={!passwordToVerify || !hashToVerify}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('tools.bcrypt.verifyButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BCryptHash;
