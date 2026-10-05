'use client';

import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import {
  REGEX_PATTERNS,
  getCategories,
  getPatternsByCategory,
  RegexPattern,
} from './utils/generator';
import { DEFAULT_SELECTED_PATTERN } from './constants';

export default function RegexGenerator({ className }: { className?: string } & ToolComponentProps) {
  const categories = getCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] || '',
  );
  const patterns = getPatternsByCategory(selectedCategory);
  const [selectedPattern, setSelectedPattern] = useState<RegexPattern | null>(
    REGEX_PATTERNS.find(p => p.name === DEFAULT_SELECTED_PATTERN) || null,
  );
  const [customPattern, setCustomPattern] = useState<string>('');
  const [flags, setFlags] = useState<string>('');
  const [testText, setTestText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [matches, setMatches] = useState<Array<{text: string; index: number}>>([]);

  useEffect(() => {
    if (selectedPattern) {
      setCustomPattern(selectedPattern.pattern);
      setFlags(selectedPattern.flags);
      if (selectedPattern.examples.length > 0) {
        setTestText(selectedPattern.examples[0] || '');
      }
    }
  }, [selectedPattern]);

  useEffect(() => {
    try {
      if (!customPattern) {
        setMatches([]);
        return;
      }
      const regex = new RegExp(customPattern, flags);
      const found: Array<{text: string; index: number}> = [];
      let match;
      let lastIndex = 0;
      if (regex.global) {
        while ((match = regex.exec(testText)) !== null) {
          found.push({ text: match[0], index: match.index });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          lastIndex = regex.lastIndex;
        }
      } else if ((match = regex.exec(testText)) !== null) {
        found.push({ text: match[0], index: match.index });
      }
      setMatches(found);
    } catch (e) {
      setMatches([]);
    }
  }, [customPattern, flags, testText]);

  async function handleCopy() {
    if (!customPattern) return;
    try {
      const fullRegex = `/${customPattern}/${flags}`;
      await navigator.clipboard.writeText(fullRegex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  function getHighlightedTestText() {
    if (!matches.length) {
      return testText;
    }

    // Sort matches by index
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    const result = [];
    let lastIndex = 0;

    for (const match of sortedMatches) {
      if (match.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {testText.substring(lastIndex, match.index)}
          </span>,
        );
      }
      result.push(
        <mark
          key={`match-${match.index}`}
          className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
        >
          {testText.substring(match.index, match.index + match.text.length)}
        </mark>,
      );
      lastIndex = match.index + match.text.length;
    }

    if (lastIndex < testText.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {testText.substring(lastIndex)}
        </span>,
      );
    }

    return result;
  }

  function toggleFlag(flag: string) {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  }

  const hasError = (() => {
    if (!customPattern) return false;
    try {
       
      new RegExp(customPattern, flags);
      return false;
    } catch {
      return true;
    }
  })();

  return (
    <div className={className}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pattern Selection */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Pattern</label>
            <div className="max-h-[300px] overflow-auto rounded-md border border-input bg-background">
              {patterns.map((pattern) => (
                <button
                  key={pattern.name}
                  onClick={() => setSelectedPattern(pattern)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                    selectedPattern?.name === pattern.name
                      ? 'bg-primary/10 font-medium'
                      : ''
                  }`}
                >
                  <div className="font-medium">{pattern.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {pattern.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Regex Editor */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">Regular Expression</label>
              <button
                onClick={handleCopy}
                disabled={!customPattern || hasError}
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
            {hasError && (
              <div className="mb-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                Invalid regular expression syntax
              </div>
            )}
            <textarea
              value={customPattern}
              onChange={(e) => setCustomPattern(e.target.value)}
              className="mb-3 h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter your regex pattern here..."
            />

            <div>
              <span className="mb-2 block text-sm font-medium">Flags</span>
              <div className="flex flex-wrap gap-2">
                {['g', 'i', 'm', 's', 'u', 'y'].map((flag) => (
                  <label
                    key={flag}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-sm ${
                      flags.includes(flag)
                        ? 'bg-primary/10 border-primary'
                        : 'border-input'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={flags.includes(flag)}
                      onChange={() => toggleFlag(flag)}
                      className="sr-only"
                    />
                    {flag}
                    <span className="text-xs text-muted-foreground">
                      (
                      {
                        {
                          g: 'global',
                          i: 'case-insensitive',
                          m: 'multiline',
                          s: 'dotall',
                          u: 'unicode',
                          y: 'sticky',
                        }[flag]
                      }
                      )
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedPattern && (
              <div className="mt-4">
                <div className="text-sm font-medium">Description</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPattern.description}
                </p>
                {selectedPattern.examples.length > 0 && (
                  <>
                    <div className="mt-2 text-sm font-medium">Examples</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {selectedPattern.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Test Text</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter text to test your regular expression..."
            />
            {testText && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Matches ({matches.length})
                  </span>
                </div>
                <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {matches.length > 0 ? (
                    <pre className="whitespace-pre-wrap">{getHighlightedTestText()}</pre>
                  ) : (
                    <span className="text-muted-foreground">No matches found</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
