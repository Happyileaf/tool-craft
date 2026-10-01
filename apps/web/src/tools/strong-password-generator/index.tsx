import { useState, useRef, useEffect } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { Card, Input, Button, Switch, Slider } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { DEFAULT_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './constants';
import { generateStrongPassword } from './utils/generate';
import styles from '@/components/tool-layout/index.module.scss';

export default function StrongPasswordGenerator({ t }: ToolComponentProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const passwordRef = useRef<HTMLInputElement>(null);

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
    <div className={styles.container}>
      <Card className={styles.toolCard}>
        <div className={styles.controlSection}>
          <div className={styles.controlRow}>
            <label>{t('密码长度')}: {length}</label>
            <Slider
              min={MIN_PASSWORD_LENGTH}
              max={MAX_PASSWORD_LENGTH}
              value={length}
              onChange={setLength}
              className={styles.slider}
            />
          </div>

          <div className={styles.optionGrid}>
            <div className={styles.optionItem}>
              <span>{t('包含小写字母')}</span>
              <Switch checked={includeLower} onChange={setIncludeLower} />
            </div>
            <div className={styles.optionItem}>
              <span>{t('包含大写字母')}</span>
              <Switch checked={includeUpper} onChange={setIncludeUpper} />
            </div>
            <div className={styles.optionItem}>
              <span>{t('包含数字')}</span>
              <Switch checked={includeNumbers} onChange={setIncludeNumbers} />
            </div>
            <div className={styles.optionItem}>
              <span>{t('包含特殊符号')}</span>
              <Switch checked={includeSymbols} onChange={setIncludeSymbols} />
            </div>
          </div>

          <div className={styles.resultSection}>
            <Input
              ref={passwordRef}
              value={password}
              placeholder={t('点击生成按钮生成密码')}
              readOnly
              className={styles.resultInput}
            />
            <div className={styles.buttonGroup}>
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
