'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { convertBatch, type UpcDirection, type UpcResult } from './utils/upcE';
import { DEFAULT_INPUT_A_TO_E, DEFAULT_INPUT_E_TO_A, DIRECTION_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const UpcEConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<UpcDirection>('a-to-e');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT_A_TO_E);

  const results = React.useMemo<UpcResult[]>(
    () => (input.trim() === '' ? [] : convertBatch(input, direction)),
    [input, direction],
  );

  const handleDirectionChange = (next: UpcDirection) => {
    setDirection(next);
    // 切换方向且用户未输入自定义内容时，载入对应示例
    setInput((current) =>
      current.trim() === '' || current === DEFAULT_INPUT_A_TO_E || current === DEFAULT_INPUT_E_TO_A
        ? next === 'a-to-e'
          ? DEFAULT_INPUT_A_TO_E
          : DEFAULT_INPUT_E_TO_A
        : current,
    );
  };

  const validResults = results.filter((result) => result.valid);
  const outputText = validResults.map((result) => result.output).join('\n');

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success(`已复制 ${validResults.length} 条转换结果`);
  };

  const activeOption = DIRECTION_OPTIONS.find((option) => option.value === direction);

  return (
    <div className={styles.container}>
      <Card size="small" title="转换方向">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            options={DIRECTION_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => handleDirectionChange(e.target.value as UpcDirection)}
          />
          <span className={styles.hint}>{activeOption?.hint}，支持每行一条批量处理</span>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title="输入编码（每行一条）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={direction === 'a-to-e' ? '粘贴 11/12 位 UPC-A，每行一条…' : '粘贴 7/8 位 UPC-E，每行一条…'}
          />
        </Card>

        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {results.length === 0 ? (
            <Alert type="info" showIcon message="请输入需要转换的条码数字" />
          ) : (
            <div className={styles.resultList}>
              {results.map((result, index) =>
                result.valid ? (
                  <div className={styles.resultRow} key={index}>
                    <span className={styles.code}>{result.output}</span>
                    <Tag color="green">校验位 {result.checkDigit}</Tag>
                    <span className={styles.parts}>
                      {result.parts.map((part, partIndex) => (
                        <span className={styles.part} key={partIndex}>
                          {part}
                        </span>
                      ))}
                    </span>
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
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default UpcEConverter;
