'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { processText, type WrapMode } from './utils/textWrap';
import { DEFAULT_INPUT, DEFAULT_WIDTH, MODE_OPTIONS, WIDTH_PRESETS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const TextWrapFormatter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<WrapMode>('wrap');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [width, setWidth] = React.useState<number>(DEFAULT_WIDTH);
  const [breakLongWords, setBreakLongWords] = React.useState<boolean>(false);
  const [trimTrailingWhitespace, setTrimTrailingWhitespace] = React.useState<boolean>(true);

  const result = React.useMemo(
    () =>
      processText(input, mode, {
        width,
        breakLongWords,
        trimTrailingWhitespace,
      }),
    [input, mode, width, breakLongWords, trimTrailingWhitespace],
  );

  const handleCopy = () => {
    if (!result.output) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <Card size="small" title="处理选项">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as WrapMode)}
          />
          {mode === 'wrap' ? (
            <>
              <span className={styles.controlItem}>
                <span className={styles.controlLabel}>列宽</span>
                <InputNumber
                  min={1}
                  max={500}
                  precision={0}
                  value={width}
                  onChange={(value) => setWidth(typeof value === 'number' ? value : DEFAULT_WIDTH)}
                  style={{ width: 96 }}
                />
              </span>
              <Space size={4} wrap>
                {WIDTH_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    type={preset === width ? 'primary' : 'default'}
                    onClick={() => setWidth(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </Space>
              <span className={styles.controlItem}>
                <Switch size="small" checked={breakLongWords} onChange={setBreakLongWords} />
                <span>超长单词按列宽硬切</span>
              </span>
            </>
          ) : null}
          <span className={styles.controlItem}>
            <Switch size="small" checked={trimTrailingWhitespace} onChange={setTrimTrailingWhitespace} />
            <span>去除每行尾部空白</span>
          </span>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title="输入文本">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="粘贴需要折行或还原的纯文本，空行用于分隔段落…"
          />
        </Card>

        <Card
          className={styles.card}
          title="处理结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 12, maxRows: 22 }}
            />
          )}
          {result.valid ? (
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>行数</span>
                <span className={styles.metaValue}>{result.lineCount}</span>
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>最长行宽</span>
                <span className={styles.metaValue}>{result.maxLineWidth}</span>
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>段落数</span>
                <span className={styles.metaValue}>{result.paragraphCount}</span>
              </span>
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <span className={styles.hint}>
          {activeMode?.hint}；拉丁文字按词边界折行，CJK 文字按字符折行，段落间空行保留，全程本地运算
        </span>
      </div>
    </div>
  );
};

export default TextWrapFormatter;
