'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import {
  convertDomainLines,
  convertRaw,
  type ConvertResult,
  type IdnaDirection,
} from './utils/punycode';
import { MODE_OPTIONS, DIRECTION_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const PunycodeConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<'domain' | 'raw'>('domain');
  const [direction, setDirection] = React.useState<IdnaDirection>('toAscii');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result: ConvertResult = React.useMemo(() => {
    if (mode === 'domain') {
      return convertDomainLines(input, direction);
    }
    return convertRaw(input, direction);
  }, [input, mode, direction]);

  const handleSwap = () => {
    if (result.error) {
      message.error('当前输入存在错误，无法交换为输入');
      return;
    }
    setDirection(direction === 'toAscii' ? 'toUnicode' : 'toAscii');
    setInput(result.output);
  };

  const handleCopy = () => {
    if (result.error || result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const activeHint = MODE_OPTIONS.find((option) => option.value === mode)?.hint;

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
              value={direction}
              options={DIRECTION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setDirection(e.target.value as IdnaDirection)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="粘贴域名、邮箱或任意 Unicode 文本…"
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
          {result.error ? (
            <Alert type="error" showIcon message="转换错误" description={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 12, maxRows: 22 }}
            />
          )}
          {!result.error && result.warnings.length > 0 ? (
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
          size="small"
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(e) => setMode(e.target.value as 'domain' | 'raw')}
        />
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入 / 输出方向
        </Button>
        <Space>
          <Tag color="blue">
            {DIRECTION_OPTIONS.find((option) => option.value === direction)?.label}
          </Tag>
          <span className={styles.hint}>{activeHint}</span>
        </Space>
      </div>
    </div>
  );
};

export default PunycodeConverter;
