'use client';

import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { message } from 'antd';
import { ToolCategoryLabelMap, ToolCategoryEnum } from '@/tools/constants';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { calculateCRC32 } from './utils/crc32';

export default function CRC32Checksum({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput || '');
  const [checksum, setChecksum] = useState('');

  useEffect(() => {
    if (!input) {
      setChecksum('');
      return;
    }
    setChecksum(calculateCRC32(input));
  }, [input]);

  const handleCopy = async () => {
    if (checksum) {
      await copyToClipboard(checksum);
      message.success('复制成功');
    }
  };

  return (
    <div className="flex flex-col gap-6 container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-center md:text-left">
        {ToolCategoryLabelMap[ToolCategoryEnum.CRYPTO_ENCODING]} / CRC32 校验和
      </h1>

      <div className="p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-col gap-3">
          <label className="font-medium">输入文本</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在这里输入需要计算 CRC32 校验和的文本..."
            className="w-full h-32 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      {checksum && (
        <div className="p-4 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">CRC32 校验值（十六进制）:</div>
              <div className="text-xl font-mono font-medium">{checksum}</div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Copy size={18} />
              复制
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
