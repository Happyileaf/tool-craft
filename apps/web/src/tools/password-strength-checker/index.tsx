'use client';

import { useState, useEffect } from 'react';
import { Progress } from 'antd';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ToolCategoryLabelMap, ToolCategoryEnum } from '@/tools/constants';
import type { ToolComponentProps } from '../loaders';
import { checkPasswordStrength, type PasswordStrengthResult } from './utils/checker';

const levelConfig = {
  weak: {
    label: '弱',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    icon: ShieldAlert,
  },
  medium: {
    label: '中',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    icon: Shield,
  },
  strong: {
    label: '强',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    icon: ShieldCheck,
  },
};

export default function PasswordStrengthChecker({ defaultInput }: ToolComponentProps) {
  const [password, setPassword] = useState(defaultInput || '');
  const [result, setResult] = useState<PasswordStrengthResult>({
    score: 0,
    level: 'weak',
    hasLower: false,
    hasUpper: false,
    hasDigit: false,
    hasSymbol: false,
    suggestions: [],
  });

  useEffect(() => {
    setResult(checkPasswordStrength(password));
  }, [password]);

  const config = levelConfig[result.level];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-6 container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-center md:text-left">
        {ToolCategoryLabelMap[ToolCategoryEnum.CRYPTO_ENCODING]} / 密码强度检测器
      </h1>

      <div className="p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-col gap-4">
          <label className="font-medium">输入密码检测强度</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="在这里输入密码..."
            className="px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {password && (
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress
                  percent={(result.score / 4) * 100}
                  strokeColor={
                    result.level === 'weak'
                      ? '#ef4444'
                      : result.level === 'medium'
                      ? '#eab308'
                      : '#22c55e'
                  }
                  showInfo={false}
                  size={20}
                />
              </div>
              <div className={`flex items-center gap-2 font-bold ${config.color}`}>
                <Icon size={20} />
                {config.label}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                className={`p-3 rounded-md border text-center ${
                  result.hasLower ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-sm font-medium">小写字母</span>
              </div>
              <div
                className={`p-3 rounded-md border text-center ${
                  result.hasUpper ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-sm font-medium">大写字母</span>
              </div>
              <div
                className={`p-3 rounded-md border text-center ${
                  result.hasDigit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-sm font-medium">数字</span>
              </div>
              <div
                className={`p-3 rounded-md border text-center ${
                  result.hasSymbol ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-sm font-medium">特殊符号</span>
              </div>
            </div>

            {result.suggestions.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">改进建议：</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-muted-foreground">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.level === 'strong' && (
              <div className="text-green-600 font-medium text-center py-2">
                ✓ 你的密码已经满足安全要求
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
