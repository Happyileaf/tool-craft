'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Input, Select } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateRegex } from './utils/generator';
import { copyToClipboard } from '@/lib/utils';
import { message } from 'antd';

const presetOptions = [
  { label: '邮箱地址', value: 'email' },
  { label: 'URL', value: 'url' },
  { label: '手机号码（中国）', value: 'phone-cn' },
  { label: 'IP 地址 (IPv4)', value: 'ipv4' },
  { label: 'IP 地址 (IPv6)', value: 'ipv6' },
  { label: '日期 (YYYY-MM-DD)', value: 'date-ymd' },
  { label: '时间 (HH:mm:ss)', value: 'time-hms' },
  { label: '邮政编码（中国）', value: 'zip-cn' },
  { label: '身份证号码（中国）', value: 'id-card-cn' },
  { label: '十六进制颜色', value: 'hex-color' },
];

const RegexGenerator: React.FC<ToolComponentProps> = ({ }) => {
  const [patternDescription, setPatternDescription] = React.useState('');
  const [flags, setFlags] = React.useState('g');
  const [result, setResult] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const regex = await generateRegex(patternDescription, flags);
      setResult(regex);
    } catch (e) {
      setError((e as Error).message);
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    copyToClipboard(result).then(() => {
      message.success('已复制正则表达式到剪贴板');
    });
  };

  const handleClear = () => {
    setPatternDescription('');
    setResult('');
    setError(null);
  };

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const handlePresetSelect = (value: string) => {
    const presets: Record<string, string> = {
      email: '匹配邮箱地址',
      url: '匹配URL网址',
      'phone-cn': '匹配中国手机号码',
      ipv4: '匹配IPv4地址',
      ipv6: '匹配IPv6地址',
      'date-ymd': '匹配YYYY-MM-DD格式日期',
      'time-hms': '匹配HH:mm:ss格式时间',
      'zip-cn': '匹配中国邮政编码',
      'id-card-cn': '匹配中国身份证号码',
      'hex-color': '匹配十六进制颜色代码',
    };
    setPatternDescription(presets[value] || '');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">选择预设</label>
        <Select
          placeholder="选择常用正则预设，会自动填充描述"
          onChange={handlePresetSelect}
          options={presetOptions}
          allowClear
          style={{ width: '100%' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">描述你需要的正则表达式</label>
        <Input.TextArea
          value={patternDescription}
          onChange={(e) => setPatternDescription(e.target.value)}
          placeholder="例如：匹配所有以a开头的单词"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">正则修饰符（Flags）</label>
        <div className="flex flex-wrap gap-4">
          <label>
            <input
              type="checkbox"
              checked={flags.includes('g')}
              onChange={() => toggleFlag('g')}
            />{' '}
            g - 全局匹配
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.includes('i')}
              onChange={() => toggleFlag('i')}
            />{' '}
            i - 忽略大小写
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.includes('m')}
              onChange={() => toggleFlag('m')}
            />{' '}
            m - 多行模式
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.includes('s')}
              onChange={() => toggleFlag('s')}
            />{' '}
            s - . 匹配换行符
          </label>
          <label>
            <input
              type="checkbox"
              checked={flags.includes('u')}
              onChange={() => toggleFlag('u')}
            />{' '}
            u - Unicode
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="primary" onClick={handleGenerate} loading={loading}>
          生成正则表达式
        </Button>
        <Button onClick={handleClear}>
          清空
        </Button>
        {result && (
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制正则
          </Button>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">生成结果</label>
          <Input.TextArea
            value={result}
            readOnly
            rows={3}
            className="font-mono"
          />
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
        <strong>提示：</strong> 这个工具使用大语言模型根据你的自然语言描述生成正则表达式，描述越清晰，生成结果越准确。如果结果不满意，可以尝试重新描述后再次生成。
      </div>
    </div>
  );
};

export default RegexGenerator;