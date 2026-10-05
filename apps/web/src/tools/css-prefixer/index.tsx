'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import { prefixCss, BROWSER_PRESETS } from './utils/prefixer';
import { DEFAULT_SAMPLE_CSS } from './constants';

export default function CssPrefixer({ className }: { className?: string } & ToolComponentProps) {
  const [input, setInput] = useState(DEFAULT_SAMPLE_CSS);
  const [output, setOutput] = useState('');
  const [preset, setPreset] = useState<keyof typeof BROWSER_PRESETS>('default');
  const [customBrowsers, setCustomBrowsers] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function updateOutput() {
      if (!input.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const browsers = customBrowsers.trim() || BROWSER_PRESETS[preset];
        const result = await prefixCss(input, browsers);
        if (!isCancelled) {
          setOutput(result);
        }
      } catch (e) {
        if (!isCancelled) {
          setError((e as Error).message);
          setOutput('');
        }
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    }

    const timer = setTimeout(() => {
      updateOutput();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [input, preset, customBrowsers]);

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
          <span className="text-sm font-medium">Browser Target:</span>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as keyof typeof BROWSER_PRESETS)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="default">Default (Recommended)</option>
            <option value="modern">Modern Browsers</option>
            <option value="legacy">Legacy (includes IE11)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Custom:</span>
          <input
            type="text"
            placeholder="e.g. > 1%, last 2 versions"
            value={customBrowsers}
            onChange={(e) => setCustomBrowsers(e.target.value)}
            className="w-64 rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
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
          <label className="mb-2 block text-sm font-medium">Input CSS</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Paste your CSS here..."
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Output with Vendor Prefixes</label>
            <button
              onClick={handleCopy}
              disabled={!output || isProcessing}
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
              <p className="font-medium">CSS Parse Error: {error}</p>
            </div>
          ) : isProcessing ? (
            <div className="flex h-[500px] items-center justify-center rounded-md border border-input bg-background">
              <p className="text-muted-foreground">Processing...</p>
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
