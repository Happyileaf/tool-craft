'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CopyOutlined } from '@ant-design/icons';
import { addVendorPrefixes } from './utils/prefixer';
import { copyToClipboard } from '@/lib/utils';

const CssPrefixer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput ?? '');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handlePrefix = () => {
    setError(null);
    try {
      const result = addVendorPrefixes(input);
      setOutput(result);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">输入原始 CSS</label>
        <TextArea
          value={input}
          onChange={handleInputChange}
          placeholder="在此粘贴你的CSS代码..."
          className="min-h-[200px] font-mono text-sm"
          rows={10}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="primary" onClick={handlePrefix}>
          添加浏览器前缀
        </Button>
        <Button onClick={handleClear}>
          清空
        </Button>
        {output && (
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制结果
          </Button>
        )}
      </div>

      {output && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">处理结果</label>
          <TextArea
            readOnly
            value={output}
            className="min-h-[200px] font-mono text-sm"
            rows={12}
          />
        </div>
      )}
    </div>
  );
};

export default CssPrefixer;