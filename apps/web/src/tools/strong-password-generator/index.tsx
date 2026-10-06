'use client';

import { useState, useCallback } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { generateStrongPassword } from './utils/generator';
import { copyToClipboard } from '@/lib/utils';

const DEFAULT_LENGTH = 16;

import { ToolCategoryLabelMap, ToolCategoryEnum } from '@/tools/constants';

export default function StrongPasswordGenerator({ defaultInput }: ToolComponentProps) {
  const [password, setPassword] = useState(() =>
    generateStrongPassword({
      length: DEFAULT_LENGTH,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    })
  );
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    const newPassword = generateStrongPassword({
      length,
      includeLowercase,
      includeUppercase,
      includeDigits,
      includeSymbols,
    });
    setPassword(newPassword);
    setCopied(false);
  }, [length, includeLowercase, includeUppercase, includeDigits, includeSymbols]);

  const handleCopy = async () => {
    if (password) {
      await copyToClipboard(password);
      message.success('复制成功');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-center md:text-left">
        {ToolCategoryLabelMap[ToolCategoryEnum.CRYPTO_ENCODING]} / 强密码生成器
      </h1>

      <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="生成的密码会在这里显示"
            className="flex-1 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={regenerate}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            title="重新生成"
          >
            <RefreshCw size={18} />
            重新生成
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-card rounded-lg border shadow-sm">
          <label className="block mb-2 font-medium">
            密码长度: {length}
          </label>
          <input
            type="range"
            min="4"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>4</span>
            <span>32</span>
          </div>
        </div>

        <div className="p-4 bg-card rounded-lg border shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span>小写字母 (a-z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span>大写字母 (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDigits}
                onChange={(e) => setIncludeDigits(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span>数字 (0-9)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span>特殊符号</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
