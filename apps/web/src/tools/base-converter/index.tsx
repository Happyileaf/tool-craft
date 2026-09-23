'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopy } from '@/hooks/use-copy';
import { ToolComponentProps } from '@/lib/tools/tool-component-props';
import { Base, baseLabels, baseLabelsEn, defaultSampleInput } from './constants';
import { convertBase } from './utils/converter';
import { useI18n } from '@/lib/i18n';

function BaseConverter({ defaultInput }: ToolComponentProps) {
  const { t, locale } = useI18n();
  const [input, setInput] = useState(defaultInput || defaultSampleInput);
  const [fromBase, setFromBase] = useState<Base>(Base.DECIMAL);
  const [toBase, setToBase] = useState<Base>(Base.BINARY);
  const [copied, copy] = useCopy();

  const conversionResult = convertBase(input, fromBase, toBase);

  function handleCopy() {
    if (conversionResult.success) {
      copy(conversionResult.result);
    }
  }

  function swapBases() {
    setFromBase(toBase);
    setToBase(fromBase);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t('tools.baseConverter.inputLabel')}</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md bg-background font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tools.baseConverter.inputPlaceholder')}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium mb-2">{t('tools.baseConverter.fromBase')}</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={fromBase}
            onChange={(e) => setFromBase(Number(e.target.value) as Base)}
          >
            {Object.values(Base).map((base) => (
              <option key={base} value={base}>
                {locale === 'zh' ? baseLabels[base] : baseLabelsEn[base]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-shrink-0 pt-5">
          <button
            onClick={swapBases}
            className="px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
            title={t('tools.baseConverter.swap')}
          >
            ⇄
          </button>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-sm font-medium mb-2">{t('tools.baseConverter.toBase')}</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={toBase}
            onChange={(e) => setToBase(Number(e.target.value) as Base)}
          >
            {Object.values(Base).map((base) => (
              <option key={base} value={base}>
                {locale === 'zh' ? baseLabels[base] : baseLabelsEn[base]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('tools.baseConverter.result')}</label>
          {conversionResult.success && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1 rounded-md border bg-background hover:bg-accent transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  {t('tools.common.copied')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t('tools.common.copy')}
                </>
              )}
            </button>
          )}
        </div>
        {conversionResult.success ? (
          <div className="w-full p-3 border rounded-md bg-muted font-mono text-sm">
            {conversionResult.result}
          </div>
        ) : (
          <div className="w-full p-3 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            ❌ {conversionResult.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default BaseConverter;
