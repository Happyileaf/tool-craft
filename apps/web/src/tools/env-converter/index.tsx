'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { convertEnv, type EnvFormat } from './utils/env';
import { FORMAT_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const EnvConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [source, setSource] = React.useState<EnvFormat>('env');
  const [target, setTarget] = React.useState<EnvFormat>('json');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(
    () => convertEnv(input, source, target),
    [input, source, target],
  );

  const handleSwap = () => {
    if (result.error) {
      message.error('当前输入存在错误，无法交换为输入');
      return;
    }
    const previousOutput = result.output;
    setSource(target);
    setTarget(source);
    setInput(previousOutput);
  };

  const handleCopy = () => {
    if (result.error || result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

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
              value={source}
              options={FORMAT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setSource(e.target.value as EnvFormat)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="粘贴 .env / JSON / YAML / export 文本…"
          />
          {source === 'yaml' ? (
            <p className={styles.hint}>仅支持扁平 key: value，不支持嵌套与缩进。</p>
          ) : null}
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Space>
              <Radio.Group
                size="small"
                optionType="button"
                buttonStyle="solid"
                value={target}
                options={FORMAT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(e) => setTarget(e.target.value as EnvFormat)}
              />
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            </Space>
          }
        >
          {result.error ? (
            <Alert
              type="error"
              showIcon
              message={
                result.error.line
                  ? `第 ${result.error.line} 行解析错误`
                  : '解析错误'
              }
              description={result.error.message}
            />
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
                  // 警告列表长度有限且顺序稳定
                  key={`${warning.key}-${warning.line ?? 0}-${index}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={
                    warning.line ? `第 ${warning.line} 行 · ${warning.key}` : warning.key
                  }
                  description={warning.message}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入 / 输出格式
        </Button>
        <Tag color="blue">{FORMAT_OPTIONS.find((o) => o.value === source)?.hint}</Tag>
        <span className={styles.arrow}>→</span>
        <Tag color="green">{FORMAT_OPTIONS.find((o) => o.value === target)?.hint}</Tag>
      </div>
    </div>
  );
};

export default EnvConverter;
