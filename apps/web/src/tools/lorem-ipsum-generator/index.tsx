'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCcw, FileText } from 'lucide-react';
import { DEFAULT_PARAGRAPHS } from './constants';
import { generateLoremIpsum } from './utils/generate';

/**
 * Lorem Ipsum 占位文本生成器
 * 全部运算在浏览器本地完成
 *
 * @returns Lorem Ipsum 生成工具交互界面
 */
function LoremIpsumGenerator() {
  const [paragraphs, setParagraphs] = useState(DEFAULT_PARAGRAPHS);
  const [output, setOutput] = useState(() => generateLoremIpsum(paragraphs));
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    const newOutput = generateLoremIpsum(paragraphs);
    setOutput(newOutput);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="paragraphs-input"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            段落数量
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            id="paragraphs-input"
            min={1}
            max={20}
            value={paragraphs}
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              if (value >= 1 && value <= 20) {
                setParagraphs(value);
              }
            }}
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500"
          />
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <RefreshCcw className="h-4 w-4" />
            重新生成
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  复制成功
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有生成均在浏览器本地完成。
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          生成结果
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-700 dark:text-slate-300">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default LoremIpsumGenerator;
