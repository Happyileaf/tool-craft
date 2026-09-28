'use client';

import { useState, useMemo } from 'react';
import type { ToolComponentProps } from '../loaders';
import { DualTextEditor } from '@/components/tool-workspace/DualTextEditor';
import { CATEGORY } from './constants';
import { addCssPrefixes } from './utils/prefixer';

export default function CssPrefixer({ className }: ToolComponentProps) {
  const [input, setInput] = useState(`.container {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
  transform: translate(10px, 20px);
}`);
  const output = useMemo(() => {
    try {
      return addCssPrefixes(input);
    } catch (e) {
      return `处理错误：${(e as Error).message}`;
    }
  }, [input]);

  return (
    <div className={className}>
      <DualTextEditor
        input={input}
        onInputChange={setInput}
        output={output}
        leftLabel="原始 CSS"
        rightLabel="添加前缀后"
      />
    </div>
  );
}
