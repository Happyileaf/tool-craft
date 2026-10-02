'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Fingerprint } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SAMPLE_INPUT } from './constants';
import { computeCrc32 } from './utils/crc32';

/**
 * CRC32 校验和计算工具，计算文本的 CRC32 校验值，用于数据完整性校验，全部运算本地完成。
 * @returns CRC32 工具界面
 */
function Crc32Checksum() {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [checksum, setChecksum] = useState('00000000');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const result = computeCrc32(input);
    // 补齐到 8 位十六进制
    const paddedResult = result.padStart(8, '0');
    setChecksum(paddedResult);
  }, [input]);

  const handleCopy = async () => {
    if (!checksum) return;
    try {
      await navigator.clipboard.writeText(checksum);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Fingerprint className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.crc32-checksum.inputLabel')}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tools.crc32-checksum.inputPlaceholder')}
          spellCheck={false}
          className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.crc32-checksum.localNotice')}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('tools.crc32-checksum.resultLabel')}:
            </span>
            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
              {checksum}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!checksum}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isCopied ? (
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
    </div>
  );
}

export default Crc32Checksum;
