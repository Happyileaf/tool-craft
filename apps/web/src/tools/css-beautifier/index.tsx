'use client';

import { useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useCopy } from '@/hooks/use-copy';
import { ToolComponentProps } from '@/lib/tools/tool-component-props';
import { defaultSampleInput } from './constants';
import { beautifyCss } from './utils/beautify';
import { useI18n } from '@/lib/i18n';

function CssBeautifier({ defaultInput }: ToolComponentProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(defaultInput || defaultSampleInput);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [copied, copy] = useCopy();

  const output = beautifyCss(input, { indentSize });

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
          className="w-full min-h-[200px] p-3 border rounded-md bg-background font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tools.common.cssPlaceholder')}
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{t('tools.cssBeautifier.indentSize')}:</span>
        {[2, 4].map((size) => (
          <button
            key={size}
            onClick={() => setIndentSize(size)}
            className={`px-4 py-2 rounded-md border transition-colors ${
              indentSize === size
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            {size} {t('tools.cssBeautifier.spaces')}
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
        <pre className="w-full min-h-[200px] p-3 border rounded-md bg-muted overflow-auto">
          <code className="font-mono text-sm">{output}</code>
        </pre>
      </div>
    </div>
  );
}

export default CssBeautifier;
