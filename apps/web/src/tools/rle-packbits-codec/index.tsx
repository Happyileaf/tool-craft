'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Statistic, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { runRle, type RleDirection, type RleMode } from './utils/rle';
import { DEFAULT_INPUT, DIRECTION_OPTIONS, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const RlePackbitsCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<RleMode>('text');
  const [direction, setDirection] = React.useState<RleDirection>('encode');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => runRle(input, mode, direction), [input, mode, direction]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);
  const isHexMode = mode !== 'text';
  const sizeUnit = mode === 'text' ? '字符' : '字节';
  const expanded = result.ratioPercent < 0;

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const inputTitle =
    direction === 'encode'
      ? mode === 'text'
        ? '文本输入（支持多行）'
        : '文本输入（按 UTF-8 编码为字节）'
      : mode === 'text'
        ? 'RLE 编码输入（逐行解码）'
        : 'Hex 编码输入（空白自动忽略）';

  const outputTitle =
    direction === 'encode'
      ? mode === 'text'
        ? 'RLE 编码结果'
        : '编码结果（Hex）'
      : '解码文本';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          options={DIRECTION_OPTIONS}
          onChange={(e) => setDirection(e.target.value as RleDirection)}
        />
        <Radio.Group
          optionType="button"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(e) => setMode(e.target.value as RleMode)}
        />
        <Button size="small" onClick={() => setInput(DEFAULT_INPUT)}>
          示例输入
        </Button>
        <Button size="small" onClick={() => setInput('')}>
          清空
        </Button>
      </div>

      <div className={styles.panels}>
        <Card className={styles.card} title={inputTitle}>
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={
              direction === 'encode' ? '输入要编码的文本…' : isHexMode ? '粘贴 Hex 编码…' : '粘贴 RLE 编码文本…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={outputTitle}
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
          {result.error ? (
            <div className={styles.warnings}>
              <Alert type="error" showIcon className={styles.warningItem} message={result.error} />
            </div>
          ) : null}
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

      <div className={styles.stats}>
        <Card size="small">
          <Statistic
            title={direction === 'encode' ? `原始大小（${sizeUnit}）` : `载荷大小（${sizeUnit}）`}
            value={result.originalSize}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={direction === 'encode' ? `编码后大小（${sizeUnit}）` : `还原大小（${sizeUnit}）`}
            value={result.resultSize}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="压缩率（节省比例）"
            value={result.ratioPercent.toFixed(1)}
            suffix="%"
            valueStyle={expanded ? { color: '#cf1322' } : undefined}
          />
        </Card>
        <Card size="small">
          <div className={styles.ratioWarn}>
            <span className={styles.hint}>膨胀提示</span>
            {input === '' ? (
              <Tag>无输入</Tag>
            ) : expanded ? (
              <Tag color="red">已膨胀（负值表示产物更大）</Tag>
            ) : (
              <Tag color="green">未膨胀</Tag>
            )}
          </div>
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message={
          <Space size={8}>
            <Tag color="blue">{activeMode?.label}</Tag>
            <span className={styles.hint}>{activeMode?.hint}</span>
          </Space>
        }
      />
    </div>
  );
};

export default RlePackbitsCodec;
