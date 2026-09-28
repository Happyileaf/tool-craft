'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Select, SelectProps } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { convertCsvToJson, convertJsonToCsv } from './utils/converter';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { message } from 'antd';

const directionOptions: SelectProps['options'] = [
  { label: 'CSV → JSON', value: 'csv-to-json' },
  { label: 'JSON → CSV', value: 'json-to-csv' },
];

const CsvJsonConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput ?? '');
  const [output, setOutput] = React.useState('');
  const [direction, setDirection] = React.useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');
  const [error, setError] = React.useState<string | null>(null);

  const handleConvert = () => {
    setError(null);
    try {
      if (direction === 'csv-to-json') {
        const result = convertCsvToJson(input);
        setOutput(JSON.stringify(result, null, 2));
      } else {
        const jsonInput = JSON.parse(input);
        const result = convertJsonToCsv(jsonInput);
        setOutput(result);
      }
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
    copyToClipboard(output).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">转换方向</label>
        <Select
          value={direction}
          onChange={(value) => setDirection(value as any)}
          options={directionOptions}
          style={{ width: 200 }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {direction === 'csv-to-json' ? '输入 CSV' : '输入 JSON'}
        </label>
        <TextArea
          value={input}
          onChange={handleInputChange}
          placeholder={direction === 'csv-to-json'
            ? '在此粘贴你的CSV数据...'
            : '在此粘贴你的JSON数据...'}
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
        <Button type="primary" onClick={handleConvert}>
          转换
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
          <label className="text-sm font-medium">转换结果</label>
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
}

export default CsvJsonConverter;