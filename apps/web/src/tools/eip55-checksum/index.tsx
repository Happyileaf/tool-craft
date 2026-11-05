'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { processBatch, type Eip55Result } from './utils/eip55';
import { DEFAULT_INPUT, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const Eip55Checksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<'encode' | 'verify'>('encode');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const results = React.useMemo<Eip55Result[]>(
    () => (input.trim() === '' ? [] : processBatch(input, mode)),
    [input, mode],
  );

  const validResults = results.filter((result) => result.valid);
  const outputText = validResults.map((result) => result.output).join('\n');

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success(`已复制 ${validResults.length} 条地址`);
  };

  const activeOption = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <Card size="small" title="处理模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as 'encode' | 'verify')}
          />
          <span className={styles.hint}>{activeOption?.hint}，支持每行一条批量处理</span>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title="输入地址（每行一条，可省略 0x）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder="粘贴 20 字节以太坊地址，每行一条…"
          />
        </Card>

        <Card
          className={styles.card}
          title={mode === 'encode' ? 'EIP-55 校验和地址' : '校验结果'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {results.length === 0 ? (
            <Alert type="info" showIcon message="请输入需要处理的以太坊地址" />
          ) : (
            <div className={styles.resultList}>
              {results.map((result, index) =>
                result.valid ? (
                  <div className={styles.resultRow} key={index}>
                    <span className={styles.code}>{result.output}</span>
                    {mode === 'verify' ? (
                      result.checksumMatched ? (
                        <Tag color="green">校验和正确</Tag>
                      ) : (
                        <Tag color="orange">无有效校验和</Tag>
                      )
                    ) : (
                      <Tag color="blue">EIP-55</Tag>
                    )}
                  </div>
                ) : (
                  <div className={`${styles.resultRow} ${styles.resultRowError}`} key={index}>
                    第 {index + 1} 行无效：{result.error}
                  </div>
                ),
              )}
            </div>
          )}
          {results.length > 0 ? (
            <p className={styles.summary}>
              共 {results.length} 条，成功 {validResults.length} 条，失败 {results.length - validResults.length} 条
              {mode === 'verify'
                ? `，校验和匹配 ${results.filter((r) => r.checksumMatched === true).length} 条`
                : ''}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default Eip55Checksum;
