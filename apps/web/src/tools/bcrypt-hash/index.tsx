'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { useI18n } from '@/lib/i18n';
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

  function doHash() {
    if (!password) {
      setHash('');
      return;
    }
    const salt = bcrypt.genSaltSync(rounds);
    const newHash = bcrypt.hashSync(password, salt);
    setHash(newHash);
  }

  function doVerify() {
    if (!passwordToVerify || !hashToVerify) {
      setVerifyResult(null);
      return;
    }
    const result = bcrypt.compareSync(passwordToVerify, hashToVerify);
    setVerifyResult(result);
  }

  // Trigger re-calculate when password or rounds changes
  if (mode === Mode.HASH && (password || hash)) {
    doHash();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode(Mode.HASH);
              setVerifyResult(null);
            }}
            className={
              mode === Mode.HASH
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.bcrypt.hashMode')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(Mode.VERIFY);
              setVerifyResult(null);
            }}
            className={
              mode === Mode.VERIFY
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.bcrypt.verifyMode')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {mode === Mode.HASH && (
          <>
            {/* Password input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.bcrypt.passwordToHash')}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('tools.bcrypt.passwordPlaceholder')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Rounds slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.bcrypt.costFactor')} (rounds = {rounds})
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('tools.bcrypt.costFactorHint')}
                </span>
              </div>
              <input
                type="range"
                min={MIN_ROUNDS}
                max={MAX_ROUNDS}
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900 dark:accent-slate-100"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{MIN_ROUNDS}</span>
                <span>{MAX_ROUNDS}</span>
              </div>
            </div>

            {/* Result */}
            {hash && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('tools.bcrypt.generatedHash')}
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('tools.bcrypt.hashLength')}: {hash.length}
                  </span>
                </div>
                <pre className="overflow-auto break-all rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                  {hash}
                </pre>
              </div>
            )}
          </>
        )}

        {mode === Mode.VERIFY && (
          <>
            {/* Password to verify */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.bcrypt.passwordToVerify')}
              </label>
              <input
                type="text"
                value={passwordToVerify}
                onChange={(e) => {
                  setPasswordToVerify(e.target.value);
                  setVerifyResult(null);
                }}
                placeholder={t('tools.bcrypt.passwordPlaceholderVerify')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Hash to verify */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.bcrypt.hashToVerify')}
              </label>
              <textarea
                value={hashToVerify}
                onChange={(e) => {
                  setHashToVerify(e.target.value);
                  setVerifyResult(null);
                }}
                placeholder={t('tools.bcrypt.hashPlaceholder')}
                className="min-h-[80px] rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={doVerify}
              disabled={!passwordToVerify || !hashToVerify}
              className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {t('tools.bcrypt.verifyButton')}
            </button>

            {/* Verify result */}
            {verifyResult !== null && (
              <div className={`mt-2 rounded-lg border p-3 ${
                verifyResult
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              }`}>
                <p className={`text-sm font-medium ${
                  verifyResult
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {verifyResult
                    ? t('tools.bcrypt.match')
                    : t('tools.bcrypt.notMatch')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BCryptHash;
