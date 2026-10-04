'use client';

import { useState } from 'react';
import { ToolComponentProps } from '../loaders';
import { Input, Button } from 'antd';
import { crc32 } from './utils/crc32';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

export default function Crc32Checksum({ defaultSampleInput }: ToolComponentProps) {
  const [text, setText] = useState<string>(defaultSampleInput || '');
  const [result, setResult] = useState<string>('');

  const calculate = () => {
    setResult(crc32(text));
  };

  const handleCopy = () => {
    if (result) {
      copyToClipboard(result);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="text" className="text-sm font-medium">输入文本</label>
        <textarea
          id="text"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="输入需要计算CRC32校验和的文本"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '200px' }}
        />
      </div>

      <Button onClick={calculate}>计算 CRC32</Button>

      {result && (
        <div className="flex flex-col gap-2">
          <label htmlFor="result" className="text-sm font-medium">CRC32 结果</label>
          <div className="flex gap-2">
            <Input
              id="result"
              type="text"
              value={result}
              readOnly
              className="font-mono"
            />
            <Button onClick={handleCopy} className="shrink-0">
              <Copy size={18} className="mr-2" />
              复制
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
