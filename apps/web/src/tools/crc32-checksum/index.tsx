import { useState, useEffect } from 'react';
import { ToolComponentProps } from '@/tools/types';
import { Card, Input, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import styles from '@/components/tool-layout/index.module.scss';
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
    <div className={styles.container}>
      <Card className={styles.toolCard}>
        <div className={styles.controlSection}>
          <div className={styles.controlRow}>
            <label>{t('输入文本')}</label>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('在此输入需要计算 CRC32 校验和的文本')}
              rows={8}
              className={styles.textInput}
            />
          </div>

          {result && (
            <div className={styles.resultSection}>
              <label>{t('CRC32 校验和 (hex)')}</label>
              <div className={styles.resultRow}>
                <Input value={result} readOnly className={styles.resultInput} />
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
