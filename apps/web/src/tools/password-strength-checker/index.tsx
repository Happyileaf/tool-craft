import { useState, useEffect } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { Card, Input, Progress, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from '@/components/tool-layout/index.module.scss';
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
    <div className={styles.container}>
      <Card className={styles.toolCard}>
        <div className={styles.controlSection}>
          <div className={styles.controlRow}>
            <label>{t('输入密码')}</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('在此输入需要检测强度的密码')}
              className={styles.passwordInput}
              size="large"
              allowClear
            />
          </div>

          {password && (
            <>
              <div className={styles.strengthSection}>
                <div className={styles.strengthHeader}>
                  <span>{t('密码强度')}: </span>
                  <Tag color={config.color} icon={config.icon}>
                    {t(config.label.zh)}
                  </Tag>
                </div>
                <Progress
                  percent={config.percent}
                  status={result.level === 'weak' ? 'exception' : result.level === 'strong' ? 'success' : 'active'}
                  strokeColor={config.color}
                  className={styles.strengthProgress}
                />
              </div>

              {result.suggestions.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <h4>{t('改进建议')}:</h4>
                  <ul className={styles.suggestionsList}>
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.level === 'strong' && (
                <div className={styles.strongMessage}>
                  <CheckCircleOutlined /> {t('这是一个安全强度足够的密码')}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
