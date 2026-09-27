'use client';

import { useState } from 'react';
import { Check, Copy, Table, Braces, Eraser, ArrowLeftRight } from 'lucide-react';
import { ToolCategoryEnum, ToolProcessingEnum } from '../../constants';
import { DEFAULT_SAMPLE_CSV, DEFAULT_SAMPLE_JSON, DELIMITER_OPTIONS } from './constants';
import { csvToJson } from './utils/csvToJson';
import { jsonToCsv } from './utils/jsonToCsv';

type Mode = 'csv-to-json' | 'json-to-csv';

function CsvJsonConverter() {
  const [input, setInput] = useState(DEFAULT_SAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('csv-to-json');
  const [delimiter, setDelimiter] = useState(',');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'csv-to-json') {
        const result = csvToJson(input, delimiter);
        setOutput(JSON.stringify(result, null, 2));
      } else {
        let json;
        try {
          json = JSON.parse(input);
        } catch (e) {
          throw new Error('无效的 JSON 格式');
        }
        if (!Array.isArray(json)) {
          throw new Error('JSON 必须是数组格式');
        }
        const result = jsonToCsv(json, delimiter);
        setOutput(result);
      }
    } catch (error) {
      setOutput(`转换错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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

  const toggleMode = () => {
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setInput(output);
    setOutput(input);
  };

  const getInputLabel = () => {
    return mode === 'csv-to-json' ? 'CSV 输入' : 'JSON 输入';
  };

  const getOutputLabel = () => {
    return mode === 'csv-to-json' ? 'JSON 输出' : 'CSV 输出';
  };

  const getInputIcon = () => {
    return mode === 'csv-to-json' ? <Table className="h-4 w-4" /> : <Braces className="h-4 w-4" />;
  };

  const getOutputIcon = () => {
    return mode === 'csv-to-json' ? <Braces className="h-4 w-4" /> : <Table className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {getInputIcon()}
            {getInputLabel()}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Eraser className="h-3.5 w-3.5" />
              清空
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入内容..."
          spellCheck={false}
          className="h-40 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">分隔符:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {DELIMITER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={toggleMode}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            交换方向
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          所有转换在浏览器本地完成，数据不会上传到服务器
        </p>
      </div>

      <button
        type="button"
        onClick={handleConvert}
        className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        开始转换
      </button>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {getOutputIcon()}
            {getOutputLabel()}
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
          placeholder="转换结果将显示在这里..."
          spellCheck={false}
          className="h-40 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 sm:text-sm"
        />
      </div>
    </div>
  );
}

export default CsvJsonConverter;
