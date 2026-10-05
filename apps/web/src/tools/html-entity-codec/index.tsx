'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, ArrowLeftRight, Eraser } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { decodeHtmlEntities, encodeHtmlEntities } from './utils/codec';
import { DEFAULT_SAMPLE_INPUT } from './constants';

type Mode = 'encode' | 'decode';

export default function HtmlEntityCodec({ className }: { className?: string } & ToolComponentProps) {
  const [input, setInput] = useState(DEFAULT_SAMPLE_INPUT);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('decode');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (mode === 'decode') {
      setOutput(decodeHtmlEntities(input));
    } else {
      setOutput(encodeHtmlEntities(input));
    }
  }, [input, mode]);

  function toggleDirection() {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput(input);
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
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium">
            {mode === 'decode' ? 'Decode HTML Entities' : 'Encode to HTML Entities'}
          </span>
        </div>
        <button
          onClick={toggleDirection}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Flip Direction
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
              mode === 'decode'
                ? 'Paste HTML with entities here...'
                : 'Paste plain text here...'
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
          <pre className="h-[500px] w-full overflow-auto rounded-md border border-input bg-background px-3 py-2 text-sm">
            {output || 'Output will appear here...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
