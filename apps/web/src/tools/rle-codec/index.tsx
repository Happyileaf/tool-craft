'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Empty,
  Input,
  Radio,
  Segmented,
  Space,
  Statistic,
  Tabs,
  Tag,
} from 'antd';
import {
  decodeBasicRle,
  decodePackBits,
  encodeBasicRle,
  encodePackBits,
  parseHex,
  textToBytes,
  toHex,
  bytesToText,
} from './utils/rle';
import { DEFAULT_TEXT, HINT, type IoMode, type RleVariant } from './constants';
import styles from './index.module.css';

const { TextArea } = Input;

const RleCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<'encode' | 'decode'>('encode');
  const [variant, setVariant] = React.useState<RleVariant>('basic');
  const [ioMode, setIoMode] = React.useState<IoMode>('text');
  const [rawInput, setRawInput] = React.useState(defaultInput || DEFAULT_TEXT);

  const output = React.useMemo(() => {
    if (direction === 'encode') {
      const bytes = ioMode === 'text' ? textToBytes(rawInput) : parseHex(rawInput).bytes;
      const result =
        variant === 'basic' ? encodeBasicRle(bytes) : encodePackBits(bytes);
      return {
        hex: toHex(result.bytes),
        originalLength: result.originalLength,
        encodedLength: result.encodedLength,
        compressionRatio: result.compressionRatio,
        error: null as string | null,
      };
    }

    const parsed = parseHex(rawInput);
    if (parsed.error) {
      return { hex: '', originalLength: 0, encodedLength: 0, compressionRatio: 0, error: parsed.error };
    }
    const decoded =
      variant === 'basic' ? decodeBasicRle(parsed.bytes) : decodePackBits(parsed.bytes);
    if (decoded.error) {
      return { hex: '', originalLength: 0, encodedLength: parsed.bytes.length, compressionRatio: 0, error: decoded.error };
    }
    return {
      hex: toHex(decoded.bytes),
      textPreview: bytesToText(decoded.bytes),
      originalLength: parsed.bytes.length,
      encodedLength: decoded.bytes.length,
      compressionRatio: 0,
      error: null as string | null,
    };
  }, [direction, variant, ioMode, rawInput]);

  const expanded = output.encodedLength > output.originalLength && direction === 'encode';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="geekblue">RLE</Tag>
        <Segmented
          options={[
            { label: '编码', value: 'encode' },
            { label: '解码', value: 'decode' },
          ]}
          value={direction}
          onChange={(v) => setDirection(v as 'encode' | 'decode')}
        />
        <Segmented
          options={[
            { label: '基础 RLE', value: 'basic' },
            { label: 'PackBits', value: 'packbits' },
          ]}
          value={variant}
          onChange={(v) => setVariant(v as RleVariant)}
        />
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          size="small"
          value={ioMode}
          onChange={(e) => setIoMode(e.target.value as IoMode)}
          options={[
            { label: '文本输入', value: 'text', disabled: direction === 'decode' },
            { label: 'HEX 输入', value: 'hex' },
          ]}
        />
      </div>

      <Card className={styles.card} title={direction === 'encode' ? '原始数据' : '编码 HEX'}>
        <TextArea
          className={styles.textarea}
          rows={5}
          spellCheck={false}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={direction === 'decode' ? '粘贴空格分隔的 HEX 字节，如 05 41 03 42' : '输入要编码的文本或 HEX'}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>{HINT}</p>
      </Card>

      {output.error ? (
        <Alert type="error" showIcon message="输入有误" description={output.error} />
      ) : rawInput.trim() === '' ? (
        <Empty description="暂无数据" />
      ) : (
        <>
          <Card className={styles.card} title={direction === 'encode' ? '编码结果（HEX）' : '解码结果（HEX）'}>
            <Input.TextArea
              className={styles.textarea}
              rows={4}
              readOnly
              value={output.hex}
            />
            {direction === 'decode' && output.textPreview !== undefined && (
              <Alert
                style={{ marginTop: 8 }}
                type="info"
                showIcon
                message="按 UTF-8 解码的文本预览"
                description={<span className={styles.mono}>{output.textPreview || '（无可打印文本）'}</span>}
              />
            )}
          </Card>

          {direction === 'encode' && (
            <Card className={styles.card} title="压缩统计">
              <Space size="large" wrap>
                <Statistic title="原始字节数" value={output.originalLength} />
                <Statistic title="编码后字节数" value={output.encodedLength} />
                <Statistic
                  title="压缩率"
                  value={output.compressionRatio.toFixed(1)}
                  suffix="%"
                  valueStyle={expanded ? { color: '#cf1322' } : undefined}
                />
              </Space>
              {expanded && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="warning"
                  showIcon
                  message={`编码后比原始数据多 ${output.encodedLength - output.originalLength} 字节（膨胀），该数据不适合用 RLE 压缩`}
                />
              )}
            </Card>
          )}
        </>
      )}

      <Alert
        type="info"
        showIcon
        message="基础 RLE 以 [count, byte] 成对输出且游程按 255 截断；PackBits 用有符号标记头区分字面段（0..127）与重复段（-1..-127），0x80 为无操作填充。"
      />
    </div>
  );
};

export default RleCodec;
