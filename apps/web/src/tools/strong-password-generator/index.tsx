
'use client';

import React, { useState, useCallback } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Button, Input, Slider, Checkbox, Space, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { generatePassword, PasswordOptions } from './utils/generator';
import {
  DEFAULT_LENGTH,
  DEFAULT_INCLUDE_LOWERCASE,
  DEFAULT_INCLUDE_UPPERCASE,
  DEFAULT_INCLUDE_NUMBERS,
  DEFAULT_INCLUDE_SYMBOLS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';

const StrongPasswordGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeLowercase, setIncludeLowercase] = useState(DEFAULT_INCLUDE_LOWERCASE);
  const [includeUppercase, setIncludeUppercase] = useState(DEFAULT_INCLUDE_UPPERCASE);
  const [includeNumbers, setIncludeNumbers] = useState(DEFAULT_INCLUDE_NUMBERS);
  const [includeSymbols, setIncludeSymbols] = useState(DEFAULT_INCLUDE_SYMBOLS);

  const regeneratePassword = useCallback(() => {
    const options: PasswordOptions = {
      length,
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols,
    };
    const newPassword = generatePassword(options);
    setPassword(newPassword);
  }, [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols]);

  const handleCopy = async () => {
    if (!password) return;
    await copyToClipboard(password);
    message.success('密码已复制到剪贴板');
  };

  // 初始生成
  React.useEffect(() => {
    regeneratePassword();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <div className="flex flex-col gap-6">
          {/* 密码结果显示区域 */}
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={password}
              readOnly
              size="large"
              placeholder="生成的密码会显示在这里"
              style={{ fontSize: '1.25rem', fontFamily: 'monospace' }}
            />
            <Button type="primary" onClick={handleCopy} disabled={!password}>
              <CopyOutlined />
              复制
            </Button>
          </Space.Compact>

          {/* 密码长度滑块 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>密码长度: {length}</span>
            </div>
            <Slider
              value={length}
              onChange={(value) => setLength(value)}
              min={4}
              max={64}
              step={1}
            />
          </div>

          {/* 字符类型选项 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Checkbox
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
              >
                包含小写字母 (a-z)
              </Checkbox>
            </div>
            <div>
              <Checkbox
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
              >
                包含大写字母 (A-Z)
              </Checkbox>
            </div>
            <div>
              <Checkbox
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
              >
                包含数字 (0-9)
              </Checkbox>
            </div>
            <div>
              <Checkbox
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
              >
                包含特殊符号 (!@#$%...)
              </Checkbox>
            </div>
          </div>

          {/* 重新生成按钮 */}
          <div className="flex justify-center">
            <Button type="primary" size="large" onClick={regeneratePassword} style={{ minWidth: '160px' }}>
              <ReloadOutlined />
              重新生成
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StrongPasswordGenerator;
