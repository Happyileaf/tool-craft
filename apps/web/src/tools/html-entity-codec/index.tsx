'use client';

import { useState } from 'react';
import { Check, Copy, Code, Eraser } from 'lucide-react';
import { DEFAULT_SAMPLE_INPUT } from './constants';
import { encodeHtmlEntities, decodeHtmlEntities } from './utils/htmlEntityCodec';

type Mode = 'encode' | 'decode';

function HtmlEntityCodec() {
  const [input, setInput] = useState(DEFAULT_SAMPLE_INPUT);
  const [mode, setMode] = useState<Mode>('encode');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    const result = mode === 'encode'
      ? encodeHtmlEntities(input)
      : decodeHtmlEntities(input);
    setOutput(result);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Code className="h-4 w-4" />
            输入HTML
          </label>
          <button
            type="button"
            onClick={handleClear}
            className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
          >
            <Eraser className="h-3.5 w-3.5" />
            清空
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入HTML..."
          spellCheck={false}
          className="h-36 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">操作:</span>
            <label className="flex cursor-pointer items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                name="mode"
                value="encode"
                checked={mode === 'encode'}
                onChange={() => setMode('encode')}
                className="text-slate-900 focus:ring-slate-900 dark:text-slate-100"
              />
              编码
            </label>
            <label className="flex cursor-pointer items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                name="mode"
                value="decode"
                checked={mode === 'decode'}
                onChange={() => setMode('decode')}
                className="text-slate-900 focus:ring-slate-900 dark:text-slate-100"
              />
              解码
            </label>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          转换常用HTML实体：&amp; &lt; &gt; &quot; &#39; | 所有运算在浏览器本地完成
        </p>
      </div>

      <button
        type="button"
        onClick={handleConvert}
        className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        {mode === 'encode' ? '编码' : '解码'}
      </button>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Code className="h-4 w-4" />
            结果
          </label>
          {output && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">复制成功</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>复制结果</span>
                </>
              )}
            </button>
          )}
        </div>
        <textarea
          value={output}
          readOnly
          placeholder="结果将显示在这里..."
          spellCheck={false}
          className="h-36 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
      </div>
    </div>
  );
}

export default HtmlEntityCodec;
