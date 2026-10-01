'use client';
import { useState, useRef, useEffect } from 'react';
import type { ToolComponentProps } from '../loaders';
import { InputRef } from 'antd/es/input';
import { Card, Input, Button, Switch, Slider } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './constants';
import { generateStrongPassword } from './utils/generate';

export default function StrongPasswordGenerator({ t }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const passwordRef = useRef<InputRef>(null);

  const handleGenerate = () => {
    const newPassword = generateStrongPassword(
      length,
      includeLower,
      includeUpper,
      includeNumbers,
      includeSymbols
    );
    setPassword(newPassword);
  };

  const handleCopy = () => {
    if (!password) {
      message.info(t('请先生成密码'));
      return;
    }
    navigator.clipboard.writeText(password).then(() => {
      message.success(t('复制成功'));
    });
  };

  // 初始生成
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('密码长度')}: {length}</label>
            <Slider
              min={MIN_PASSWORD_LENGTH}
              max={MAX_PASSWORD_LENGTH}
              value={length}
              onChange={setLength}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('包含小写字母')}</span>
              <Switch checked={includeLower} onChange={setIncludeLower} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('包含大写字母')}</span>
              <Switch checked={includeUpper} onChange={setIncludeUpper} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('包含数字')}</span>
              <Switch checked={includeNumbers} onChange={setIncludeNumbers} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('包含特殊符号')}</span>
              <Switch checked={includeSymbols} onChange={setIncludeSymbols} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              ref={passwordRef}
              value={password}
              placeholder={t('点击生成按钮生成密码')}
              readOnly
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleGenerate}
              >
                {t('重新生成')}
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                {t('复制密码')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
