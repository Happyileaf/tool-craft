'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processCode, processLines } from './utils/grayCode';
import type { GrayMode } from './utils/grayCode';
import { MODE_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const GrayCodeConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<GrayMode>('bin2gray');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const batch = React.useMemo(() => processLines(input, mode), [input, mode]);
  const detail = React.useMemo(() => {
    const firstLine = input.split('\n').find((line) => line.trim() !== '');
    return firstLine ? processCode(firstLine, mode) : null;
  }, [input, mode]);

  const handleCopy = () => {
    if (batch.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(batch.output);
    message.success('已复制转换结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入（二进制）"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as GrayMode)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="每行一个二进制数（支持 0b 前缀、空格与下划线）…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出（二进制）"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={batch.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {detail && detail.valid ? (
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>十进制</span>
                <span className={styles.metaValue}>{detail.decimal}</span>
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>十六进制</span>
                <span className={styles.metaValue}>0x{detail.hex}</span>
              </span>
            </div>
          ) : null}
          {batch.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {batch.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      {detail && detail.valid ? (
        <Card size="small" title="逐位推导（首行）">
          <div className={styles.steps}>
            {detail.steps.map((step) => (
              <div key={step.index} className={styles.stepRow}>
                <span className={styles.stepIndex}>位 {step.index}</span>
                <span className={styles.stepReason}>{step.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <Space>
          <span className={styles.hint}>
            {activeMode?.hint}；BigInt 运算支持任意位宽，多行批量处理并逐行标注错误
          </span>
        </Space>
      </div>
    </div>
  );
};

export default GrayCodeConverter;
