'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processLines, type EanMode } from './utils/ean13';
import { MODE_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const Ean13Checksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<EanMode>('ean13');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => processLines(input, mode), [input, mode]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

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
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as EanMode)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="每行一个条码编号（空格与连字符会被忽略）…"
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
        <Tag color="blue">{activeMode?.label}</Tag>
        <Space>
          <span className={styles.hint}>
            {activeMode?.hint}；容忍空白与连字符，非法行逐行标注错误
          </span>
        </Space>
      </div>
    </div>
  );
};

export default Ean13Checksum;
