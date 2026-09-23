'use client';

import { useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useCopy } from '@/hooks/use-copy';
import { ToolComponentProps } from '@/lib/tools/tool-component-props';
import { defaultSampleInput } from './constants';
import { removeDuplicateLines } from './utils/remover';
import { useI18n } from '@/lib/i18n/i18n-provider';

function RemoveDuplicateLines({ defaultInput }: ToolComponentProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(defaultInput || defaultSampleInput);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [sortLines, setSortLines] = useState(false);
  const [copied, copy] = useCopy();

  const output = removeDuplicateLines(input, caseSensitive, sortLines);

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
          placeholder={t('tools.common.textPlaceholder')}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">{t('tools.removeDuplicateLines.caseSensitive')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sortLines}
            onChange={(e) => setSortLines(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">{t('tools.removeDuplicateLines.sortLines')}</span>
        </label>
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
          <div className="text-sm text-muted-foreground">
            {input ? (
              <>
                {input.split('\n').length} → {output.split('\n').length} lines ({' '}
                {input.split('\n').length - output.split('\n').length} removed )
              </>
            ) : (
              <>0 lines</>
            )}
          </div>
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

export default RemoveDuplicateLines;
