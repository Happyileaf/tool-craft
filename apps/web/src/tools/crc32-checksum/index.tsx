'use client';
import { useState, useEffect } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { calculateCRC32 } from './utils/crc32';

export default function Crc32Checksum({ t }: ToolComponentProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!input) {
      setResult('');
      return;
    }
    const crc = calculateCRC32(input);
    setResult(crc);
  }, [input]);

  const handleCopy = () => {
    if (!result) {
      message.info(t('请先输入文本计算'));
      return;
    }
    navigator.clipboard.writeText(result).then(() => {
      message.success(t('复制成功'));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('输入文本')}</label>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('在此输入需要计算 CRC32 校验和的文本')}
              rows={8}
            />
          </div>

          {result && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('CRC32 校验和 (hex)')}</label>
              <div className="flex gap-2">
                <Input value={result} readOnly />
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  {t('复制')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
