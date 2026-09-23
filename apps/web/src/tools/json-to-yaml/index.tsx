'use client';

import { useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useCopy } from '@/hooks/use-copy';
import { ToolComponentProps } from '@/lib/tools/tool-component-props';
import { defaultSampleInput } from './constants';
import { jsonToYaml } from './utils/converter';

/**
 * JSON to YAML converter tool
 * Converts JSON data to formatted YAML output
 */
function JsonToYaml({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || defaultSampleInput);
  const [copied, copy] = useCopy();

  const convertResult = jsonToYaml(input);

  function handleClear() {
    setInput('');
  }

  function handleCopy() {
    if (convertResult.success) {
      copy(convertResult.result);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">JSON Input</label>
        <textarea
          className="w-full min-h-[200px] p-3 border rounded-md bg-background font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your JSON here..."
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
        >
          <Eraser className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">YAML Output</label>
          {convertResult.success && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1 rounded-md border bg-background hover:bg-accent transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
        {convertResult.success ? (
          <pre className="w-full min-h-[200px] p-3 border rounded-md bg-muted overflow-auto">
            <code className="font-mono text-sm">{convertResult.result}</code>
          </pre>
        ) : (
          <div className="w-full min-h-[100px] p-3 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            ❌ Error: {convertResult.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default JsonToYaml;
