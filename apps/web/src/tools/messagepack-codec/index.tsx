'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Segmented, Space, Statistic, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  MessagePackError,
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  decodeMessagePack,
  encodeJsonToBytes,
  hexDump,
  hexToBytes,
  type ExtValue,
} from './utils/messagepack';
import {
  DEFAULT_BASE64,
  DEFAULT_HEX,
  DEFAULT_JSON,
  FORMAT_OPTIONS,
  MODE_OPTIONS,
  type BinaryFormat,
  type CodecMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { TextArea } = Input;

/** 把解码值渲染为 JSON 文本，bigint 加引号、ext/bin 保留可读形态。 */
function decodedToJsonText(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, v) => {
      if (typeof v === 'bigint') return v.toString();
      if (v && typeof v === 'object' && '__ext' in v) {
        const ext = v as ExtValue;
        return { extType: ext.type, dataHex: ext.dataHex };
      }
      return v;
    },
    2,
  );
}

const EncodePanel: React.FC = () => {
  const [jsonText, setJsonText] = React.useState(DEFAULT_JSON);
  const [format, setFormat] = React.useState<BinaryFormat>('hex');

  const parsed = React.useMemo<{ bytes: Uint8Array | null; error: string }>(() => {
    if (jsonText.trim() === '') return { bytes: null, error: '' };
    try {
      return { bytes: encodeJsonToBytes(jsonText), error: '' };
    } catch (e) {
      return { bytes: null, error: e instanceof Error ? e.message : '编码失败' };
    }
  }, [jsonText]);

  const outputText = React.useMemo(() => {
    if (!parsed.bytes) return '';
    return format === 'hex' ? bytesToHex(parsed.bytes, 1) : bytesToBase64(parsed.bytes);
  }, [parsed.bytes, format]);

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success('已复制编码结果');
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="① 输入 JSON 文本">
        <TextArea
          rows={8}
          className={styles.editor}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"key":"value"}'
        />
      </Card>

      {parsed.error && <Alert type="error" showIcon message="JSON 语法错误" description={parsed.error} />}

      {parsed.bytes && (
        <>
          <Card size="small" title="② 编码结果">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div className={styles.controls}>
                <span className={styles.label}>输出格式</span>
                <Segmented
                  options={FORMAT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={format}
                  onChange={(v) => setFormat(v as BinaryFormat)}
                />
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                  复制
                </Button>
              </div>
              <Alert className={styles.resultBox} type="success" showIcon message={outputText} />
              <div className={styles.metaRow}>
                <Statistic title="字节数" value={parsed.bytes.length} />
              </div>
            </Space>
          </Card>

          <Card size="small" title="③ 十六进制转储（每行 16 字节）">
            <pre className={styles.dump}>{hexDump(parsed.bytes)}</pre>
          </Card>
        </>
      )}
    </div>
  );
};

const DecodePanel: React.FC = () => {
  const [format, setFormat] = React.useState<BinaryFormat>('hex');
  const [input, setInput] = React.useState(DEFAULT_HEX);

  const switchFormat = (next: BinaryFormat) => {
    setFormat(next);
    setInput(next === 'hex' ? DEFAULT_HEX : DEFAULT_BASE64);
  };

  const parsed = React.useMemo<{ value: unknown; bytes: Uint8Array | null; error: string; offset: number | null }>(() => {
    if (input.trim() === '') return { value: null, bytes: null, error: '', offset: null };
    try {
      const bytes = format === 'hex' ? hexToBytes(input) : base64ToBytes(input);
      const value = decodeMessagePack(bytes);
      return { value, bytes, error: '', offset: null };
    } catch (e) {
      const offset = e instanceof MessagePackError ? e.offset : null;
      return { value: null, bytes: null, error: e instanceof Error ? e.message : '解码失败', offset };
    }
  }, [input, format]);

  const outputText = React.useMemo(
    () => (parsed.value === null ? '' : decodedToJsonText(parsed.value)),
    [parsed.value],
  );

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success('已复制 JSON 结果');
  };

  return (
    <div className={styles.container}>
      <Card size="small" title="① 输入 MessagePack 二进制负载">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div className={styles.controls}>
            <span className={styles.label}>输入格式</span>
            <Segmented
              options={FORMAT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              value={format}
              onChange={(v) => switchFormat(v as BinaryFormat)}
            />
          </div>
          <TextArea
            rows={5}
            className={styles.editor}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={format === 'hex' ? '82 a7 63 ...' : 'Base64 字符串'}
          />
        </Space>
      </Card>

      {parsed.error && (
        <Alert
          type="error"
          showIcon
          message="解码失败"
          description={
            <span>
              {parsed.error}
              {parsed.offset !== null && <span>　定位：第 {parsed.offset} 字节</span>}
            </span>
          }
        />
      )}

      {parsed.bytes && (
        <>
          <Card size="small" title="② 解码 JSON 结果" extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>}>
            <Alert className={styles.resultBox} type="success" showIcon message={outputText} />
            <div className={styles.metaRow} style={{ marginTop: 12 }}>
              <Statistic title="字节数" value={parsed.bytes.length} />
            </div>
          </Card>

          <Card size="small" title="③ 十六进制转储（每行 16 字节）">
            <pre className={styles.dump}>{hexDump(parsed.bytes)}</pre>
          </Card>
        </>
      )}
    </div>
  );
};

const MessagePackCodec: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<CodecMode>('encode');

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value as CodecMode)}
        optionType="button"
        buttonStyle="solid"
      >
        {MODE_OPTIONS.map((o) => (
          <Radio.Button key={o.value} value={o.value}>
            {o.label}
          </Radio.Button>
        ))}
      </Radio.Group>
      <Alert type="info" showIcon message={MODE_OPTIONS.find((o) => o.value === mode)?.hint} />
      {mode === 'encode' ? <EncodePanel /> : <DecodePanel />}
    </div>
  );
};

export default MessagePackCodec;
