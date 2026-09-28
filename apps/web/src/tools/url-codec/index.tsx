'use client';

import { useState, useMemo } from 'react';
import type { ToolComponentProps } from '../loaders';
import { DualTextEditor } from '@/components/tool-workspace/DualTextEditor';
import { CATEGORY } from './constants';
import { urlEncode, urlDecode, fullUrlEncode, fullUrlDecode } from './utils/converter';

type Mode = 'encode-component' | 'decode-component' | 'encode-full' | 'decode-full';

export default function UrlCodec({ className }: ToolComponentProps) {
  const [input, setInput] = useState(`https://example.com/path?name=Hello World 你好世界`);
  const [mode, setMode] = useState<Mode>('encode-component');

  const output = useMemo(() => {
    try {
      switch (mode) {
        case 'encode-component':
          return urlEncode(input);
        case 'decode-component':
          return urlDecode(input);
        case 'encode-full':
          return fullUrlEncode(input);
        case 'decode-full':
          return fullUrlDecode(input);
      }
    } catch (e) {
      return `解码错误：${(e as Error).message}`;
    }
  }, [input, mode]);

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded border ${mode === 'encode-component' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setMode('encode-component')}
        >
          编码参数 (encodeURIComponent)
        </button>
        <button
          className={`px-4 py-2 rounded border ${mode === 'decode-component' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setMode('decode-component')}
        >
          解码参数 (decodeURIComponent)
        </button>
        <button
          className={`px-4 py-2 rounded border ${mode === 'encode-full' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setMode('encode-full')}
        >
          编码完整 URL (encodeURI)
        </button>
        <button
          className={`px-4 py-2 rounded border ${mode === 'decode-full' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setMode('decode-full')}
        >
          解码完整 URL (decodeURI)
        </button>
      </div>
      <DualTextEditor
        input={input}
        onInputChange={setInput}
        output={output}
        leftLabel="输入"
        rightLabel="输出"
      />
    </div>
  );
}
