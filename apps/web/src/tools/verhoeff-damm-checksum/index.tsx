'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  processLines,
  type ChecksumAlgorithm,
  type ChecksumMode,
} from './utils/checksum';
import { ALGORITHM_OPTIONS, DEFAULT_INPUT, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const VerhoeffDammChecksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [algorithm, setAlgorithm] = React.useState<ChecksumAlgorithm>('verhoeff');
  const [mode, setMode] = React.useState<ChecksumMode>('generate');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(
    () => processLines(input, algorithm, mode),
    [input, algorithm, mode],
  );

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const active = ALGORITHM_OPTIONS.find((option) => option.value === algorithm);
  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={algorithm}
              options={ALGORITHM_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setAlgorithm(e.target.value as ChecksumAlgorithm)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="每行一个数字编号（空格与连字符会被忽略）…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
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

      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(e) => setMode(e.target.value as ChecksumMode)}
        />
        <Tag color="blue">{active?.label}</Tag>
        <span className={styles.hint}>{activeMode?.hint}；{active?.hint}</span>
      </div>
    </div>
  );
};

export default VerhoeffDammChecksum;
