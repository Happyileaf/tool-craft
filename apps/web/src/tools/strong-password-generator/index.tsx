'use client';

import { useState } from 'react';
import { ToolComponentProps } from '../loaders';
import { Button, Slider, Checkbox, Input } from 'antd';
import { RefreshCw, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { generatePassword } from './utils/generate';
import { DEFAULT_LENGTH } from './constants';

export default function StrongPasswordGenerator({ defaultSampleInput }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const handleGenerate = () => {
    const newPassword = generatePassword({
      length,
      includeLowercase,
      includeUppercase,
      includeDigits,
      includeSymbols,
    });
    setPassword(newPassword);
  };

  const handleCopy = async () => {
    if (password) {
      await copyToClipboard(password);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">生成的密码</label>
        <Input
          id="password"
          type="text"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="点击生成按钮创建密码"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">密码长度: {length}</span>
        </div>
        <Slider
          defaultValue={length}
          min={4}
          max={64}
          step={1}
          onChange={(value: number) => setLength(value ?? length)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowercase"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
            />
            <span className="text-sm font-medium">包含小写字母</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="uppercase"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
            />
            <span className="text-sm font-medium">包含大写字母</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="digits"
              checked={includeDigits}
              onChange={(e) => setIncludeDigits(e.target.checked)}
            />
            <span className="text-sm font-medium">包含数字</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="symbols"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
            />
            <span className="text-sm font-medium">包含特殊符号</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          重新生成
        </Button>
        <Button onClick={handleCopy} disabled={!password}>
          <Copy className="mr-2 h-4 w-4" />
          复制
        </Button>
      </div>
    </div>
  );
}
