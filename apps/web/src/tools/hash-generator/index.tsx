'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eraser,
  Fingerprint,
  Hash,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_INPUT,
  HMAC_ALGORITHM,
  HashAlgorithmEnum,
  HashAlgorithmLabelMap,
} from './constants';
import { computeHash, computeHmac, type HashResult } from './utils/hash';

/**
 * 哈希生成工具页，实时计算 MD5 / SHA-1 / SHA-256 / SHA-512 摘要，
 * 全部运算在浏览器本地完成，另提供 HMAC 与哈希一致性比对能力
 *
 * @returns 哈希生成工具交互界面
 */
function HashGenerator() {
  const { t } = useI18n();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [results, setResults] = useState<HashResult[]>([]);
  const [isUppercase, setIsUppercase] = useState(false);
  const [copiedAlgorithm, setCopiedAlgorithm] =
    useState<HashAlgorithmEnum | null>(null);
  const [secret, setSecret] = useState('');
  const [hmacValue, setHmacValue] = useState('');
  const [isHmacCopied, setIsHmacCopied] = useState(false);
  const [expectedHash, setExpectedHash] = useState('');

  useEffect(() => {
    let isCancelled = false;

    /**
     * 输入变化时并行重算四种算法摘要，原文为空时不产出结果
     */
    async function updateHashes() {
      if (!input) {
        setResults([]);
        return;
      }
      const nextResults = await computeHash(input);
      if (!isCancelled) {
        setResults(nextResults);
      }
    }

    updateHashes();
    return () => {
      isCancelled = true;
    };
  }, [input]);

  useEffect(() => {
    let isCancelled = false;

    /**
     * 原文或密钥变化时重算 HMAC，二者任一为空则清空结果
     */
    async function updateHmac() {
      if (!input || !secret) {
        setHmacValue('');
        return;
      }
      const value = await computeHmac(input, secret, HMAC_ALGORITHM);
      if (!isCancelled) {
        setHmacValue(value);
      }
    }

    updateHmac();
    return () => {
      isCancelled = true;
    };
  }, [input, secret]);

  /**
   * 复制指定算法的哈希值，并在两秒后恢复按钮状态
   *
   * @param algorithm - 被复制值对应的算法
   * @param value - 写入剪贴板的哈希值
   */
  async function handleCopyHash(
    algorithm: HashAlgorithmEnum,
    value: string,
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedAlgorithm(algorithm);
      window.setTimeout(() => setCopiedAlgorithm(null), 2000);
    } catch {
      setCopiedAlgorithm(null);
    }
  }

  /**
   * 复制 HMAC 结果，并在两秒后恢复按钮状态
   */
  async function handleCopyHmac() {
    if (!hmacValue) return;
    try {
      await navigator.clipboard.writeText(hmacValue);
      setIsHmacCopied(true);
      window.setTimeout(() => setIsHmacCopied(false), 2000);
    } catch {
      setIsHmacCopied(false);
    }
  }

  const hasMatch = results.some(
    (item) =>
      expectedHash.length > 0 &&
      !item.hasError &&
      item.value.toLowerCase() === expectedHash.trim().toLowerCase(),
  );
  const isComparing = expectedHash.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="hash-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Fingerprint className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t('tools.hash.inputLabel')}
          </label>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={isUppercase}
                onChange={(event) => setIsUppercase(event.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
              />
              {t('tools.hash.uppercase')}
            </label>
            <button
              type="button"
              onClick={() => setInput('')}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Eraser className="h-3.5 w-3.5" />
              {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="hash-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('tools.hash.inputPlaceholder')}
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.hash.localNotice')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Hash className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.hash.hashAlgorithms')}
        </div>
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            {t('tools.hash.emptyNotice')}
          </div>
        ) : null}
        {results.map((item) => {
          const displayValue = isUppercase
            ? item.value.toUpperCase()
            : item.value;
          const isMatched =
            isComparing &&
            !item.hasError &&
            item.value.toLowerCase() === expectedHash.trim().toLowerCase();
          return (
            <div
              key={item.algorithm}
              className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
            >
              <div className="flex flex-col gap-1 overflow-hidden pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t(HashAlgorithmLabelMap[item.algorithm])}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    ({item.bits} bits)
                  </span>
                  {isMatched ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      {t('tools.hash.matchedBadge')}
                    </span>
                  ) : null}
                </div>
                <span
                  className={
                    item.hasError
                      ? 'font-mono text-xs text-rose-500 dark:text-rose-400 sm:text-sm'
                      : 'break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300 sm:text-sm'
                  }
                >
                  {item.hasError ? t('tools.hash.computeFailed') : displayValue}
                </span>
              </div>
              <button
                type="button"
                disabled={item.hasError}
                onClick={() => handleCopyHash(item.algorithm, displayValue)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 self-end rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:self-auto"
              >
                {copiedAlgorithm === item.algorithm ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t('common.copySuccess')}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{t('common.copy')}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <KeyRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.hash.hmacTitle')}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder={t('tools.hash.hmacKey')}
            spellCheck={false}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setSecret('')}
            className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400"
          >
            <X className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 sm:flex-row sm:items-center">
          <span className="break-all select-all font-mono text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
            {hmacValue
              ? isUppercase
                ? hmacValue.toUpperCase()
                : hmacValue
              : t('tools.hash.hmacPlaceholder')}
          </span>
          <button
            type="button"
            onClick={handleCopyHmac}
            disabled={!hmacValue}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:self-auto"
          >
            {isHmacCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('common.copySuccess')}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t('common.copy')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.hash.compareHash')}
        </div>
        <input
          type="text"
          value={expectedHash}
          onChange={(event) => setExpectedHash(event.target.value)}
          placeholder={t('tools.hash.hashToCompare')}
          spellCheck={false}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        {isComparing ? (
          <div
            className={
              hasMatch
                ? 'flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }
          >
            {hasMatch ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            {hasMatch
              ? t('tools.hash.matchSuccess')
              : t('tools.hash.matchFail')}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default HashGenerator;
