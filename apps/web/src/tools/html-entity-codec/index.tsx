'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Radio } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CopyOutlined } from '@ant-design/icons';
import { encodeHtml, decodeHtml } from './utils/codec';
import { copyToClipboard } from '@/lib/utils';
import { message } from 'antd';

type Mode = 'encode' | 'decode';

const HtmlEntityCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput ?? '');
  const [output, setOutput] = React.useState('');
  const [mode, setMode] = React.useState<Mode>('encode');

  const handleProcess = () => {
    try {
      if (mode === 'encode') {
        setOutput(encodeHtml(input));
      } else {
        setOutput(decodeHtml(input));
      }
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const handleCopy = () => {
    copyToClipboard(output).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <span className="text-sm font-medium">操作：</span>
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <Radio.Button value="encode">编码</Radio.Button>
          <Radio.Button value="decode">解码</Radio.Button>
        </Radio.Group>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {mode === 'encode' ? '输入原始 HTML' : '输入编码后的 HTML'}
        </label>
        <TextArea
          value={input}
          onChange={handleInputChange}
          placeholder={mode === 'encode'
            ? '在此粘贴你要编码的HTML...'
            : '在此粘贴你要解码的HTML...'}
          className="min-h-[150px] font-mono text-sm"
          rows={6}
        />
      </div>

      <div className="flex gap-2">
        <Button type="primary" onClick={handleProcess}>
          {mode === 'encode' ? '编码' : '解码'}
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
            className="min-h-[150px] font-mono text-sm"
            rows={6}
          />
        </div>
      )}
    </div>
  );
};

export default HtmlEntityCodec;