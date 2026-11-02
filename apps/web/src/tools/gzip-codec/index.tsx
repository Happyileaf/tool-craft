'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Statistic, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  compressText,
  compressionRatio,
  decompressBytes,
  hexToBytes,
  isCompressionSupported,
  textToBytes,
  type GzipAlgorithm,
} from './utils/gzip';
import {
  ALGORITHM_OPTIONS,
  DEFAULT_INPUT,
  FORMAT_OPTIONS,
  MODE_OPTIONS,
  type GzipMode,
  type PayloadFormat,
} from './constants';
import styles from './index.module.css';

const GzipCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<GzipMode>('compress');
  const [algorithm, setAlgorithm] = React.useState<GzipAlgorithm>('gzip');
  const [format, setFormat] = React.useState<PayloadFormat>('hex');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [roundTripOk, setRoundTripOk] = React.useState<boolean | null>(null);
  const [originalSize, setOriginalSize] = React.useState(0);
  const [compressedSize, setCompressedSize] = React.useState(0);

  const supported = isCompressionSupported();

  const run = React.useCallback(async () => {
    if (!supported) {
      setError('当前浏览器不支持 CompressionStream / DecompressionStream，请使用现代浏览器。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'compress') {
        const bytes = await compressText(input, algorithm);
        const encoded = format === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
        setOutput(encoded);
        setOriginalSize(textToBytes(input).length);
        setCompressedSize(bytes.length);
        setRoundTripOk((await decompressBytes(bytes, algorithm)) === input);
      } else {
        const bytes = format === 'hex' ? hexToBytes(input) : base64ToBytes(input);
        const text = await decompressBytes(bytes, algorithm);
        setOutput(text);
        setOriginalSize(bytes.length);
        setCompressedSize(textToBytes(text).length);
        setRoundTripOk((await compressText(text, algorithm)).length > 0);
      }
    } catch (e) {
      setOutput('');
      setRoundTripOk(null);
      setError(e instanceof Error ? e.message : '处理失败');
    } finally {
      setLoading(false);
    }
  }, [algorithm, format, input, mode, supported]);

  React.useEffect(() => {
    if (!supported) return;
    const timer = setTimeout(() => {
      void run();
    }, 200);
    return () => clearTimeout(timer);
  }, [run, supported]);

  const handleSwap = () => {
    setMode(mode === 'compress' ? 'decompress' : 'compress');
    setInput(output || input);
    setOutput('');
  };

  const handleCopy = () => {
    if (!output) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(output);
    message.success('已复制结果');
  };

  const ratio = compressionRatio(compressedSize, originalSize);

  return (
    <div className={styles.container}>
      {!supported ? (
        <Alert
          type="error"
          showIcon
          message="当前浏览器不支持原生压缩 API"
          description="CompressionStream / DecompressionStream 在 Chrome 80+、Edge 80+、Firefox 113+、Safari 16.4+ 中可用，请升级浏览器后重试。"
        />
      ) : null}

      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((o) => ({ ...o }))}
          onChange={(e) => setMode(e.target.value as GzipMode)}
        />
        <Radio.Group
          optionType="button"
          value={algorithm}
          options={ALGORITHM_OPTIONS}
          onChange={(e) => setAlgorithm(e.target.value as GzipAlgorithm)}
        />
        <Radio.Group
          optionType="button"
          value={format}
          options={FORMAT_OPTIONS.map((o) => ({ ...o }))}
          onChange={(e) => setFormat(e.target.value as PayloadFormat)}
        />
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入输出
        </Button>
      </div>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={mode === 'compress' ? '文本输入（UTF-8）' : `压缩载荷（${format}）`}
          extra={
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={
              mode === 'compress' ? '输入要压缩的文本…' : `粘贴 ${format} 压缩载荷（空白自动忽略）…`
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={mode === 'compress' ? `压缩产物（${format}）` : '解压文本'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <div className={styles.outputArea}>{output || '等待输入…'}</div>
          {error ? (
            <Alert className={styles.errorBox} type="error" showIcon message={error} />
          ) : null}
        </Card>
      </div>

      <div className={styles.stats}>
        <Card size="small">
          <Statistic title={mode === 'compress' ? '原始字节数' : '载荷字节数'} value={originalSize} />
        </Card>
        <Card size="small">
          <Statistic
            title={mode === 'compress' ? '压缩后字节数' : '解压字节数'}
            value={compressedSize}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="比率（后/原）"
            value={(ratio * 100).toFixed(1)}
            suffix="%"
          />
        </Card>
        <Card size="small">
          <div className={styles.roundTrip}>
            <span className={styles.hint}>往返校验</span>
            {roundTripOk === null ? (
              <Tag>未执行</Tag>
            ) : roundTripOk ? (
              <Tag color="green">一致</Tag>
            ) : (
              <Tag color="red">不一致</Tag>
            )}
          </div>
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="格式说明"
        description={
          <span>
            基于浏览器原生 CompressionStream / DecompressionStream，全部运算在本地完成。
            gzip 产物以魔数 <code>1f 8b</code> 开头；deflate 为原始 DEFLATE（无 zlib/gzip
            封装）。压缩产物展示为 Hex 或 Base64，解压时自动去除空白。
          </span>
        }
      />
    </div>
  );
};

export default GzipCodec;
