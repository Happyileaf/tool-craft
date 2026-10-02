'use client';

import { useState, useCallback } from 'react';
import { Check, Copy, RefreshCw, Key } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_CHARSETS,
  DEFAULT_PASSWORD_LENGTH,
  CharSetEnum,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  DEFAULT_SAMPLE_INPUT,
} from './constants';
import { generateStrongPassword } from './utils/generate';

/**
 * 强密码生成工具，基于浏览器原生 Crypto API 生成安全随机密码，
 * 支持自定义长度和字符集选择，全部运算本地完成。
 * @returns 强密码生成工具界面
 */
function StrongPasswordGenerator() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [selectedCharSets, setSelectedCharSets] =
    useState<CharSetEnum[]>(DEFAULT_CHARSETS);
  const [isCopied, setIsCopied] = useState(false);

  // 生成新密码
  const regenerate = useCallback(() => {
    if (selectedCharSets.length === 0) {
      setPassword('');
      return;
    }
    const newPassword = generateStrongPassword(length, selectedCharSets);
    setPassword(newPassword);
  }, [length, selectedCharSets]);

  // 切换字符集选中状态
  const toggleCharSet = (charSet: CharSetEnum) => {
    if (selectedCharSets.includes(charSet)) {
      // 不能取消最后一个选中的字符集
      if (selectedCharSets.length <= 1) {
        return;
      }
      setSelectedCharSets(selectedCharSets.filter((cs) => cs !== charSet));
    } else {
      setSelectedCharSets([...selectedCharSets, charSet]);
    }
  };

  // 复制结果到剪贴板
  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  // 字符集选项配置
  const charSetOptions = [
    {
      key: CharSetEnum.LOWERCASE,
      label: t('tools.strong-password-generator.lowercase'),
    },
    {
      key: CharSetEnum.UPPERCASE,
      label: t('tools.strong-password-generator.uppercase'),
    },
    {
      key: CharSetEnum.DIGITS,
      label: t('tools.strong-password-generator.digits'),
    },
    {
      key: CharSetEnum.SYMBOLS,
      label: t('tools.strong-password-generator.symbols'),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.strong-password-generator.title')}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password-length"
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t('tools.strong-password-generator.lengthLabel')}: {length}
            </label>
            <input
              type="range"
              id="password-length"
              min={MIN_PASSWORD_LENGTH}
              max={MAX_PASSWORD_LENGTH}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-36 sm:w-48 accent-slate-700 dark:accent-slate-300"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {charSetOptions.map((option) => (
              <label
                key={option.key}
                className={`cursor-pointer select-none rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCharSets.includes(option.key)
                    ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCharSets.includes(option.key)}
                  onChange={() => toggleCharSet(option.key)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-2 rounded-lg bg-white p-3 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={password}
              placeholder={
                selectedCharSets.length > 0
                  ? t('tools.strong-password-generator.generatedPlaceholder')
                  : t('tools.strong-password-generator.selectCharSet')
              }
              spellCheck={false}
              className="flex-1 rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
            />
            <button
              type="button"
              onClick={regenerate}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={t('tools.strong-password-generator.regenerate')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t('tools.strong-password-generator.regenerate')}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">
                    {t('common.copySuccess')}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden sm:inline">{t('common.copy')}</span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('tools.strong-password-generator.localNotice')}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {t('tools.strong-password-generator.entropyNotice', {
            bits: Math.floor(length * Math.log2(62)),
          })}
        </div>
      </div>
    </div>
  );
}

export default StrongPasswordGenerator;
