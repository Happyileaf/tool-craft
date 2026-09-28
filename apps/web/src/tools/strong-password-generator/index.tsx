'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, FileDown, FileText, Layers, RefreshCw, RotateCw, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { generatePassword } from './utils/generator';
import { buildCsv, buildTxt, downloadTextFile } from './utils/exporter';

const DEFAULT_LENGTH = 16;
const MIN_LENGTH = 4;
const MAX_LENGTH = 64;
const MIN_BATCH_COUNT = 1;
const MAX_BATCH_COUNT = 100;
const DEFAULT_BATCH_COUNT = 10;

interface PasswordOptions {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const DEFAULT_OPTIONS: PasswordOptions = {
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
};

/**
 * 强密码生成器，依据长度与字符集选项实时生成随机密码，
 * 全部随机过程在浏览器本地通过加密安全随机源完成
 *
 * @returns 强密码生成交互界面
 */
function StrongPasswordGenerator() {
  const { t } = useI18n();
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [batchCount, setBatchCount] = useState(DEFAULT_BATCH_COUNT);
  const [batchPasswords, setBatchPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    setPassword(
      generatePassword({
        length: DEFAULT_LENGTH,
        includeLowercase: DEFAULT_OPTIONS.lowercase,
        includeUppercase: DEFAULT_OPTIONS.uppercase,
        includeNumbers: DEFAULT_OPTIONS.numbers,
        includeSymbols: DEFAULT_OPTIONS.symbols,
      }),
    );
  }, []);

  /**
   * 依据当前长度与字符集选项生成新密码，全部选项关闭时回退为小写字母
   */
  function regenerate() {
    const nextPassword = generatePassword({
      length,
      includeLowercase: options.lowercase,
      includeUppercase: options.uppercase,
      includeNumbers: options.numbers,
      includeSymbols: options.symbols,
    });
    setPassword(nextPassword);
    setCopied(false);
  }

  /**
   * 复制生成的密码到剪贴板，并在两秒后恢复按钮状态
   */
  async function handleCopy() {
    if (!password) {
      return;
    }
    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  /**
   * 清空当前生成结果，保留长度与字符集配置
   */
  function handleClear() {
    setPassword('');
    setCopied(false);
  }

  /**
   * 切换某个字符集选项的启用状态
   *
   * @param key - 目标字符集字段名
   */
  function toggleOption(key: keyof PasswordOptions) {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  /**
   * 将输入的生成数量限制在合法范围
   *
   * @param value - 原始输入值
   */
  function handleBatchCountChange(value: string) {
    if (value === '') {
      setBatchCount(MIN_BATCH_COUNT);
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    setBatchCount(
      Math.min(MAX_BATCH_COUNT, Math.max(MIN_BATCH_COUNT, parsed)),
    );
  }

  /**
   * 依据当前配置一次性生成指定数量的密码
   */
  function handleBatchGenerate() {
    const list = Array.from({ length: batchCount }, () =>
      generatePassword({
        length,
        includeLowercase: options.lowercase,
        includeUppercase: options.uppercase,
        includeNumbers: options.numbers,
        includeSymbols: options.symbols,
      }),
    );
    setBatchPasswords(list);
    setCopiedIndex(null);
    setCopiedAll(false);
  }

  /**
   * 复制批量结果中的某一条密码，并在两秒后恢复该行状态
   *
   * @param index - 目标密码在列表中的下标
   */
  async function handleCopyItem(index: number) {
    const target = batchPasswords[index];
    if (!target) {
      return;
    }
    await navigator.clipboard.writeText(target);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 2000);
  }

  /**
   * 复制全部批量生成的密码（每行一条），并在两秒后恢复按钮状态
   */
  async function handleCopyAll() {
    if (batchPasswords.length === 0) {
      return;
    }
    await navigator.clipboard.writeText(batchPasswords.join('\n'));
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 2000);
  }

  /**
   * 清空批量生成的密码列表
   */
  function handleClearBatch() {
    setBatchPasswords([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  }

  /**
   * 导出单个生成的密码为 TXT 文件
   */
  function handleExportSingleTxt() {
    if (!password) {
      return;
    }
    downloadTextFile(password, 'password.txt', 'text/plain;charset=utf-8');
  }

  /**
   * 导出单个生成的密码为 CSV 文件
   */
  function handleExportSingleCsv() {
    if (!password) {
      return;
    }
    downloadTextFile(buildCsv([password]), 'password.csv', 'text/csv;charset=utf-8');
  }

  /**
   * 导出全部批量密码为 TXT 文件
   */
  function handleExportBatchTxt() {
    if (batchPasswords.length === 0) {
      return;
    }
    downloadTextFile(buildTxt(batchPasswords), 'passwords.txt', 'text/plain;charset=utf-8');
  }

  /**
   * 导出全部批量密码为 CSV 文件
   */
  function handleExportBatchCsv() {
    if (batchPasswords.length === 0) {
      return;
    }
    downloadTextFile(buildCsv(batchPasswords), 'passwords.csv', 'text/csv;charset=utf-8');
  }

  const optionFields: Array<{ key: keyof PasswordOptions; label: string }> = [
    { key: 'lowercase', label: t('tools.strongPasswordGenerator.lowercase') },
    { key: 'uppercase', label: t('tools.strongPasswordGenerator.uppercase') },
    { key: 'numbers', label: t('tools.strongPasswordGenerator.numbers') },
    { key: 'symbols', label: t('tools.strongPasswordGenerator.symbols') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
        <span className="flex items-center gap-2">
            <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
              {t('tools.strongPasswordGenerator.length')}：
              <span className="inline-block w-5 tabular-nums">{length}</span>
            </span>
            <input
              type="range"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="w-56 shrink-0 cursor-pointer accent-slate-900 dark:accent-slate-100"
            />
          </span>
          {optionFields.map((field) => (
            <label
              key={field.key}
              className="flex cursor-pointer select-none items-center gap-1.5 text-slate-600 dark:text-slate-400"
            >
              <input
                type="checkbox"
                checked={options[field.key]}
                onChange={() => toggleOption(field.key)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
              />
              <span>{field.label}</span>
            </label>
          ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              {t('tools.strongPasswordGenerator.generatedPassword')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={regenerate}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <RotateCw className="h-3.5 w-3.5" />
              {t('tools.strongPasswordGenerator.generate')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('common.clear')}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
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
            <button
              type="button"
              onClick={handleExportSingleTxt}
              disabled={!password}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              {t('tools.strongPasswordGenerator.exportTxt')}
            </button>
            <button
              type="button"
              onClick={handleExportSingleCsv}
              disabled={!password}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              {t('tools.strongPasswordGenerator.exportCsv')}
            </button>
          </div>
        </div>
        <div className="flex min-h-[72px] items-center bg-slate-900 p-4 dark:bg-slate-950">
          {password ? (
            <p className="break-all font-mono text-lg font-bold tracking-wide text-emerald-400">
              {password}
            </p>
          ) : (
            <p className="w-full text-center font-mono text-xs text-slate-500">
              {t('tools.strongPasswordGenerator.emptyResult')}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              {t('tools.strongPasswordGenerator.batchResult')}
            </span>
            <span className="flex items-center gap-1.5 font-normal text-slate-500 dark:text-slate-400">
              {t('tools.strongPasswordGenerator.batchCount')}：
              <input
                type="number"
                min={MIN_BATCH_COUNT}
                max={MAX_BATCH_COUNT}
                value={batchCount}
                onChange={(event) => handleBatchCountChange(event.target.value)}
                className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono tabular-nums focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchGenerate}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('tools.strongPasswordGenerator.batchGenerate')}
            </button>
            <button
              type="button"
              onClick={handleClearBatch}
              disabled={batchPasswords.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('common.clear')}
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={batchPasswords.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('common.copySuccess')}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  {t('tools.strongPasswordGenerator.copyAll')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportBatchTxt}
              disabled={batchPasswords.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              {t('tools.strongPasswordGenerator.exportTxt')}
            </button>
            <button
              type="button"
              onClick={handleExportBatchCsv}
              disabled={batchPasswords.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              {t('tools.strongPasswordGenerator.exportCsv')}
            </button>
          </div>
        </div>
        <div className="bg-slate-900 p-4 dark:bg-slate-950">
          {batchPasswords.length === 0 ? (
            <p className="py-2 text-center font-mono text-xs text-slate-500">
              {t('tools.strongPasswordGenerator.batchEmpty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {batchPasswords.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 rounded-md bg-slate-800/60 px-3 py-1.5"
                >
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-all font-mono text-xs text-emerald-400 sm:text-sm">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyItem(index)}
                    className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">
                          {t('common.copySuccess')}
                        </span>
                      </>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default StrongPasswordGenerator;
