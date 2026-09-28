import { useState, useMemo } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { DualTextEditor } from '@/components/DualTextEditor';
import { CATEGORY } from './constants';
import { htmlEntityEncode, htmlEntityDecode } from './utils/converter';

export default function HtmlEntityCodec({ className }: ToolComponentProps) {
  const [input, setInput] = useState(`<div class="container">
  <h1>Hello & Welcome</h1>
</div>`);
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  const output = useMemo(() => {
    try {
      if (direction === 'encode') {
        return htmlEntityEncode(input);
      } else {
        return htmlEntityDecode(input);
      }
    } catch (e) {
      return `转换错误：${(e as Error).message}`;
    }
  }, [input, direction]);

  return (
    <div className={className}>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded border ${direction === 'encode' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setDirection('encode')}
        >
          HTML 编码
        </button>
        <button
          className={`px-4 py-2 rounded border ${direction === 'decode' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
          onClick={() => setDirection('decode')}
        >
          HTML 解码
        </button>
      </div>
      <DualTextEditor
        input={input}
        onInputChange={setInput}
        output={output}
        leftLabel={direction === 'encode' ? '原始 HTML' : '编码后的 HTML'}
        rightLabel={direction === 'encode' ? '编码后' : '解码后'}
        showSwap
        onSwap={() => {
          setInput(output);
          setDirection(direction === 'encode' ? 'decode' : 'encode');
        }}
      />
    </div>
  );
}
