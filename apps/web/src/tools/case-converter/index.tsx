'use client';

import { useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useCopy } from '@/hooks/use-copy';
import { ToolComponentProps } from '@/lib/tools/tool-component-props';
import {
  CaseConversionMode,
  conversionModeLabels,
  conversionModeLabelsEn,
  defaultSampleInput,
} from './constants';
import { convertCase } from './utils/converter';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { LanguageEnum } from '@/lib/i18n/constants';

function CaseConverter({ defaultInput }: ToolComponentProps) {
  const { t, language } = useI18n();
  const [input, setInput] = useState(defaultInput || defaultSampleInput);
  const [mode, setMode] = useState<CaseConversionMode>(CaseConversionMode.LOWERCASE);
  const [copied, copy] = useCopy();

  const output = convertCase(input, mode);

  function handleClear() {
    setInput('');
  }

  function handleCopy() {
    copy(output);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t('tools.common.inputLabel')}</label>
        <textarea
          className="w-full min-h-[150px] p-3 border rounded-md bg-background font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tools.common.textPlaceholder')}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(CaseConversionMode).map((conversionMode) => (
          <button
            key={conversionMode}
            onClick={() => setMode(conversionMode)}
            className={`px-4 py-2 rounded-md border transition-colors ${
              mode === conversionMode
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            {language === LanguageEnum.ZH
              ? conversionModeLabels[conversionMode]
              : conversionModeLabelsEn[conversionMode]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
        >
          <Eraser className="w-4 h-4" />
          {t('tools.common.clear')}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('tools.common.outputLabel')}</label>
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
                <Copy className="w-4 h-4" />
                {t('tools.common.copy')}
              </>
            )}
          </button>
        </div>
        <pre className="w-full min-h-[150px] p-3 border rounded-md bg-muted overflow-auto">
          <code className="font-mono text-sm">{output}</code>
        </pre>
      </div>
    </div>
  );
}

export default CaseConverter;
