'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, ArrowLeftRight, Eraser } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { encodeUriComponent, decodeUriComponent, encodeUri, decodeUri } from './utils/codec';
import { DEFAULT_SAMPLE_INPUT } from './constants';

type Mode = 'encode-component' | 'decode-component' | 'encode-uri' | 'decode-uri';

export default function UrlCodec({ className }: { className?: string } & ToolComponentProps) {
  const [input, setInput] = useState(DEFAULT_SAMPLE_INPUT);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('decode-component');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);
      if (!input.trim()) {
        setOutput('');
        return;
      }

      switch (mode) {
        case 'encode-component':
          setOutput(encodeUriComponent(input));
          break;
        case 'decode-component':
          setOutput(decodeUriComponent(input));
          break;
        case 'encode-uri':
          setOutput(encodeUri(input));
          break;
        case 'decode-uri':
          setOutput(decodeUri(input));
          break;
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, mode]);

  function toggleDirection() {
    // Flip between encode and decode for the same type
    if (mode === 'encode-component') {
      setMode('decode-component');
    } else if (mode === 'decode-component') {
      setMode('encode-component');
    } else if (mode === 'encode-uri') {
      setMode('decode-uri');
    } else {
      setMode('encode-uri');
    }
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

  const modeLabels: Record<Mode, string> = {
    'encode-component': 'Encode URI Component',
    'decode-component': 'Decode URI Component',
    'encode-uri': 'Encode Full URI',
    'decode-uri': 'Decode Full URI',
  };

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium">
            {modeLabels[mode]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('encode-component')}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === 'encode-component'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            Encode Component
          </button>
          <button
            onClick={() => setMode('decode-component')}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === 'decode-component'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            Decode Component
          </button>
          <button
            onClick={() => setMode('encode-uri')}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === 'encode-uri'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            Encode URI
          </button>
          <button
            onClick={() => setMode('decode-uri')}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === 'decode-uri'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            Decode URI
          </button>
        </div>
        <button
          onClick={toggleDirection}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Flip
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
            placeholder="Paste URL or component here..."
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <p>
              <strong>encodeURIComponent:</strong> encodes special characters like
              : / ? # [ ] @ $ &amp; + , =
            </p>
            <p>
              <strong>encodeURI:</strong> does not encode : / ? # [ ] @ @
              preserves the complete URI structure
            </p>
          </div>
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
              <p className="font-medium">Decode Error: {error}</p>
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
