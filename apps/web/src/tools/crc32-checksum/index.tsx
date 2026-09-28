'use client';

import { useState } from 'react';
import { Check, Copy, Hash, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { calculateCRC32 } from './utils/crc32';

const DEFAULT_INPUT = 'The quick brown fox jumps over the lazy dog';

/**
 * CRC32 校验和计算器，输入文本计算 CRC32 校验值，用于数据完整性验证
 *
 * @returns CRC32 计算工具交互界面
 */
function CRC32Checksum() {
  const { t } = useI18n();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [copied, setCopied] = useState(false);
  const result = calculateCRC32(input);

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <span className="flex items-center gap-1.5 px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Hash className="h-3.5 w-3.5" />
          CRC32
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(DEFAULT_INPUT)}
            disabled={input === DEFAULT_INPUT}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {t('common.sample')}
          </button>
          <button
            type="button"
            onClick={() => setInput('')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          {t('tools.crc32.inputLabel')}
        </div>
        <div className="px-4 py-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('tools.crc32.placeholder')}
            className="min-h-[140px] w-full resize-y bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
          <span>
            {t('tools.crc32.length')}：{input.length}{' '}
            {t('tools.crc32.characters')}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {t('common.clientSideExecution')}
          </span>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <span>{t('tools.crc32.resultLabel')}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
        <div className="bg-slate-900 p-4 dark:bg-slate-950">
          <p className="break-all font-mono text-xl font-bold tracking-[0.2em] text-emerald-400">
            {result}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CRC32Checksum;
