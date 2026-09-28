'use client';

import React, { useState, useCallback } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Progress } from 'antd';
import { checkPasswordStrength, PasswordCheckResult } from './utils/checker';
import { PasswordStrengthLevel, PasswordStrengthInfo } from './constants';

const PasswordStrengthChecker: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [password, setPassword] = useState(defaultInput || '');
  const [result, setResult] = useState<PasswordCheckResult | null>(null);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setResult(checkPasswordStrength(value));
    } else {
      setResult(null);
    }
  }, []);

  const getProgressPercent = () => {
    if (!result) return 0;
    return Math.round((result.score / 10) * 100);
  };

  const currentLevelInfo = result ? PasswordStrengthInfo[result.level] : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              输入密码检测强度
            </label>
            <Input.Password
              value={password}
              onChange={handlePasswordChange}
              placeholder="请输入密码"
              size="large"
            />
          </div>

          {result && (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">强度评分: {result.score}/10</span>
                  <span className={`text-sm font-bold ${currentLevelInfo?.color}`}>
                    {currentLevelInfo?.label}
                  </span>
                </div>
                <Progress
                  percent={getProgressPercent()}
                  strokeColor={currentLevelInfo?.bgColor}
                  showInfo={false}
                  size="small"
                />
              </div>

              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">改进建议：</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PasswordStrengthChecker;
