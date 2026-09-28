// I don't have this file in the existing codebase, need to create it
'use client';

import { useState } from 'react';
import { Card } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';

export interface DualTextEditorProps {
  input: string;
  onInputChange: (value: string) => void;
  output: string;
  leftLabel: string;
  rightLabel: string;
  disabledInput?: boolean;
  showSwap?: boolean;
  onSwap?: () => void;
}

export function DualTextEditor({
  input,
  onInputChange,
  output,
  leftLabel,
  rightLabel,
  disabledInput = false,
  showSwap = false,
  onSwap,
}: DualTextEditorProps) {
  const [copied, setCopied] = useState<'input' | 'output' | null>(null);

  const handleCopy = async (text: string, type: 'input' | 'output') => {
    await copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={leftLabel} className="h-full">
        <textarea
          className="w-full h-[500px] border-0 focus:outline-none resize-none bg-transparent dark:bg-transparent"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={disabledInput}
        />
        {!disabledInput && (
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => handleCopy(input, 'input')}
            title="Copy input"
          >
            {copied === 'input' ? <CheckOutlined className="text-green-500" /> : <CopyOutlined />}
          </button>
        )}
      </Card>
      <Card title={rightLabel} className="h-full relative">
        <pre className="w-full h-[500px] p-4 overflow-auto bg-transparent dark:bg-transparent whitespace-pre-wrap">{output}</pre>
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={() => handleCopy(output, 'output')}
          title="Copy output"
        >
          {copied === 'output' ? <CheckOutlined className="text-green-500" /> : <CopyOutlined />}
        </button>
        {showSwap && onSwap && (
          <button
            className="absolute bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={onSwap}
          >
            Swap
          </button>
        )}
      </Card>
    </div>
  );
}
