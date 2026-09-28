'use client';

import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
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
  const [result, setResult] = useState(() => calculateCRC32(DEFAULT_INPUT));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(calculateCRC32(input));
  }, [input]);

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('tools.crc32.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.crc32.placeholder')}
            className="min-h-[120px] rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Result */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.crc32.resultLabel')}
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('tools.crc32.length')}: {input.length} {t('tools.crc32.characters')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-lg dark:border-slate-700 dark:bg-slate-800">
              {result}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              title={t('common.copyResult')}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CRC32Checksum;
