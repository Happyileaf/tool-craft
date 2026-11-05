'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { processBatch, type BcdMode, type BcdResult, type BcdScheme } from './utils/bcd';
import {
  DEFAULT_DIGITS,
  DEFAULT_GROUPS,
  DEFAULT_PACKED,
  MODE_OPTIONS,
  SCHEME_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const BcdCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<BcdMode>('encode');
  const [scheme, setScheme] = React.useState<BcdScheme>('8421');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_DIGITS);

  const useScheme = mode === 'encode' || mode === 'decode';

  const results = React.useMemo<BcdResult[]>(
    () => (input.trim() === '' ? [] : processBatch(input, mode, scheme)),
    [input, mode, scheme],
  );

  const defaultFor = (nextMode: BcdMode): string => {
    if (nextMode === 'encode' || nextMode === 'decode') return nextMode === 'encode' ? DEFAULT_DIGITS : DEFAULT_GROUPS;
    return nextMode === 'pack' ? DEFAULT_DIGITS : DEFAULT_PACKED;
  };

  const handleModeChange = (next: BcdMode) => {
    setMode(next);
    setInput((current) =>
      current.trim() === '' ||
      current === DEFAULT_DIGITS ||
      current === DEFAULT_GROUPS ||
      current === DEFAULT_PACKED
        ? defaultFor(next)
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

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const placeholder = (): string => {
    if (mode === 'encode' || mode === 'pack') return '每行一个十进制数字串…';
    if (mode === 'decode') return '每行一组空格分隔的 4 位二进制码组…';
    return '每行一串十六进制字节（如 12 34 或 0x12,0x34）…';
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="转换模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => handleModeChange(e.target.value as BcdMode)}
          />
          {useScheme ? (
            <Radio.Group
              optionType="button"
              size="small"
              value={scheme}
              options={SCHEME_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(e) => setScheme(e.target.value as BcdScheme)}
            />
          ) : null}
          <span className={styles.hint}>{activeMode?.hint}，支持每行一条批量处理</span>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title="输入（每行一条）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={placeholder()}
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
            <Alert type="info" showIcon message="请输入需要转换的内容" />
          ) : (
            <div className={styles.resultList}>
              {results.map((result, index) =>
                result.valid ? (
                  <div className={styles.resultRow} key={index}>
                    <span className={styles.code}>{result.output}</span>
                    <span className={styles.parts}>
                      {result.nibbles.map((nibble, nibbleIndex) => (
                        <span
                          className={`${styles.part} ${nibble.digit === null ? styles.partPad : ''}`}
                          key={nibbleIndex}
                        >
                          {nibble.binary}
                          {nibble.digit !== null ? `→${nibble.digit}` : ''}
                        </span>
                      ))}
                    </span>
                    {result.error ? <Tag color="warning">{result.error}</Tag> : null}
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

export default BcdCodec;
