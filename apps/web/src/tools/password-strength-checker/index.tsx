'use client';
import { useState, useEffect } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Progress, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { checkPasswordStrength, PasswordStrengthResult } from './utils/check';

const levelConfig = {
  weak: {
    label: {
      zh: '弱',
      en: 'Weak',
    },
    color: '#ff4d4f',
    percent: 25,
    icon: <CloseCircleOutlined />,
  },
  medium: {
    label: {
      zh: '中',
      en: 'Medium',
    },
    color: '#faad14',
    percent: 60,
    icon: <InfoCircleOutlined />,
  },
  strong: {
    label: {
      zh: '强',
      en: 'Strong',
    },
    color: '#52c41a',
    percent: 100,
    icon: <CheckCircleOutlined />,
  },
};

export default function PasswordStrengthChecker({ t }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<PasswordStrengthResult>({
    score: 0,
    level: 'weak',
    suggestions: [],
  });

  useEffect(() => {
    if (!password) {
      setResult({
        score: 0,
        level: 'weak',
        suggestions: [],
      });
      return;
    }
    const newResult = checkPasswordStrength(password);
    setResult(newResult);
  }, [password]);

  const config = levelConfig[result.level];

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('输入密码')}</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('在此输入需要检测强度的密码')}
              size="large"
              allowClear
            />
          </div>

          {password && (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('密码强度')}:</span>
                  <Tag color={config.color} icon={config.icon}>
                    {t(config.label.zh)}
                  </Tag>
                </div>
                <Progress
                  percent={config.percent}
                  status={result.level === 'weak' ? 'exception' : result.level === 'strong' ? 'success' : 'active'}
                  strokeColor={config.color}
                />
              </div>

              {result.suggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('改进建议')}:</h4>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="mb-1">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.level === 'strong' && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircleOutlined /> <span className="text-sm font-medium">{t('这是一个安全强度足够的密码')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
