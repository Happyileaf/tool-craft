'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, ArrowLeftRight, Eraser } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { csvToJson, jsonToCsv } from './utils/converter';
import { DEFAULT_SAMPLE_CSV, DEFAULT_SAMPLE_JSON } from './constants';

type Mode = 'csv-to-json' | 'json-to-csv';

export default function CsvJsonConverter({ className }: { className?: string } & ToolComponentProps) {
  const [input, setInput] = useState(DEFAULT_SAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('csv-to-json');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        return;
      }
      if (mode === 'csv-to-json') {
        const json = csvToJson(input);
        setOutput(JSON.stringify(json, null, 2));
      } else {
        try {
          const parsed = JSON.parse(input);
          const csv = jsonToCsv(parsed);
          setOutput(csv);
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, mode]);

  function toggleMode() {
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setInput(output);
    setOutput(input);
    setError(null);
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError(null);
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium">
            {mode === 'csv-to-json' ? 'CSV → JSON' : 'JSON → CSV'}
          </span>
        </div>
        <button
          onClick={toggleMode}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Swap Direction
        </button>
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={
              mode === 'csv-to-json'
                ? 'Paste your CSV here...'
                : 'Paste your JSON array here...'
            }
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Output</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          {error ? (
            <div className="flex h-[500px] items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error: {error}</p>
            </div>
          ) : (
            <pre className="h-[500px] w-full overflow-auto rounded-md border border-input bg-background px-3 py-2 text-sm">
              {output || 'Output will appear here...'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
