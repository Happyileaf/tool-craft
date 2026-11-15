'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Select, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { BYTE_SAMPLES, INTEGER_SAMPLES, SAMPLE_BYTES, SAMPLE_INTEGER } from './constants';
import {
  type BitWidth,
  type Signedness,
  formatBytes,
  formatDecimal,
  interpretBytes,
  intToBytes,
  parseHexBytes,
  parseInteger,
  reverseBytes,
  splitElements,
  swapHalfwords,
  toHexLiteral,
} from './utils/endian';
import styles from './index.module.css';

type Mode = 'bytes' | 'integer';

/**
 * 字节序转换器：十六进制字节 ↔ 整数双向编解码，
 * 同时给出大端 / 小端解释，并支持整串反转与半字交换。
 */
const EndiannessConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('bytes');
  const [input, setInput] = React.useState<string>(defaultInput ?? SAMPLE_BYTES);
  const [width, setWidth] = React.useState<BitWidth>(32);
  const [signedness, setSignedness] = React.useState<Signedness>('unsigned');

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const byteResult = React.useMemo(() => {
    if (mode !== 'bytes') return undefined;
    const parsed = parseHexBytes(input);
    if (!parsed.ok || parsed.bytes.length === 0) return { parsed };
    const values = interpretBytes(parsed.bytes, width, signedness);
    const { elements, remainder } = splitElements(parsed.bytes, width);
    return {
      parsed,
      values,
      elements,
      remainder,
      reversed: reverseBytes(parsed.bytes),
      halfSwapped: swapHalfwords(parsed.bytes),
    };
  }, [mode, input, width, signedness]);

  const integerResult = React.useMemo(() => {
    if (mode !== 'integer') return undefined;
    const parsed = parseInteger(input, width, signedness);
    if (!parsed.ok || parsed.value === undefined) return { parsed };
    return {
      parsed,
      bigEndian: intToBytes(parsed.value, width, 'be'),
      littleEndian: intToBytes(parsed.value, width, 'le'),
    };
  }, [mode, input, width, signedness]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setInput(next === 'bytes' ? SAMPLE_BYTES : SAMPLE_INTEGER);
  };

  return (
    <div className={styles.container}>
      <Card title="输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <label>转换方向</label>
            <Radio.Group
              value={mode}
              onChange={(event) => switchMode(event.target.value as Mode)}
            >
              <Radio.Button value="bytes">字节 → 整数</Radio.Button>
              <Radio.Button value="integer">整数 → 字节</Radio.Button>
            </Radio.Group>
          </div>

          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label>位宽</label>
              <Select<BitWidth>
                value={width}
                onChange={setWidth}
                options={[
                  { value: 16, label: '16 位' },
                  { value: 32, label: '32 位' },
                  { value: 64, label: '64 位' },
                ]}
                style={{ width: 120 }}
              />
            </div>
            <div className={styles.field}>
              <label>符号</label>
              <Radio.Group
                value={signedness}
                onChange={(event) => setSignedness(event.target.value as Signedness)}
              >
                <Radio.Button value="unsigned">无符号</Radio.Button>
                <Radio.Button value="signed">有符号</Radio.Button>
              </Radio.Group>
            </div>
          </div>

          <div className={styles.field}>
            <label>{mode === 'bytes' ? '十六进制字节序列' : '整数（十进制或 0x 十六进制）'}</label>
            <Input.TextArea
              className={styles.mono}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder={
                mode === 'bytes' ? '例如 DE AD BE EF 或 0xDE,0xAD,0xBE,0xEF' : '例如 305419896 或 0x12345678'
              }
            />
            <div className={styles.samples}>
              {(mode === 'bytes' ? BYTE_SAMPLES : INTEGER_SAMPLES).map((sample) => (
                <Tag key={sample} className={styles.mono} onClick={() => setInput(sample)}>
                  {sample}
                </Tag>
              ))}
            </div>
          </div>
        </Space>
      </Card>

      {mode === 'bytes' && byteResult ? (
        !byteResult.parsed.ok ? (
          <Alert type="error" showIcon message="字节解析失败" description={byteResult.parsed.error} />
        ) : byteResult.parsed.bytes.length === 0 ? (
          <Alert type="info" showIcon message="请输入至少一个字节" />
        ) : (
          <Card title={`按 ${width} 位${signedness === 'signed' ? '有符号' : '无符号'}解释`}>
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.label}>大端（big-endian）</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatDecimal(byteResult.values!.bigEndian)}
                </span>
                <span className={`${styles.sub} ${styles.mono}`}>
                  {toHexLiteral(byteResult.values!.bigEndian, width)}
                </span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.label}>小端（little-endian）</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatDecimal(byteResult.values!.littleEndian)}
                </span>
                <span className={`${styles.sub} ${styles.mono}`}>
                  {toHexLiteral(byteResult.values!.littleEndian, width)}
                </span>
              </div>
            </div>

            {byteResult.parsed.warnings.map((warning) => (
              <Alert
                key={warning}
                type="warning"
                showIcon
                message={warning}
                style={{ marginTop: 12 }}
              />
            ))}
            {byteResult.remainder!.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
                message={`末尾 ${byteResult.remainder!.length} 个字节不足一个 ${width} 位元素（${formatBytes(
                  byteResult.remainder!,
                )}），未参与元素切分`}
              />
            ) : null}

            <dl className={styles.componentGrid}>
              <dt>原始字节</dt>
              <dd className={styles.mono}>{formatBytes(byteResult.parsed.bytes)}</dd>
              <dt>整串反转</dt>
              <dd className={styles.mono}>{formatBytes(byteResult.reversed!)}</dd>
              <dt>半字交换</dt>
              <dd className={styles.mono}>{formatBytes(byteResult.halfSwapped!)}</dd>
            </dl>

            <div className={styles.copyRow}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(formatDecimal(byteResult.values!.bigEndian))}
              >
                复制大端值
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(formatDecimal(byteResult.values!.littleEndian))}
              >
                复制小端值
              </Button>
            </div>

            {byteResult.elements!.length > 1 ? (
              <div className={styles.elements}>
                <span className={styles.label}>按 {width} 位切分的元素（逐个按大端解释）</span>
                {byteResult.elements!.map((element, index) => (
                  <div key={index} className={styles.elementRow}>
                    <span className={styles.mono}>#{index + 1}</span>
                    <span className={styles.mono}>{formatBytes(element)}</span>
                    <span className={styles.mono}>
                      {formatDecimal(interpretBytes(element, width, signedness).bigEndian)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        )
      ) : null}

      {mode === 'integer' && integerResult ? (
        !integerResult.parsed.ok ? (
          <Alert
            type="error"
            showIcon
            message="整数解析失败"
            description={integerResult.parsed.error}
          />
        ) : (
          <Card title="字节序列">
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.label}>大端（big-endian）</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatBytes(integerResult.bigEndian!)}
                </span>
                <span className={styles.sub}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(formatBytes(integerResult.bigEndian!))}
                  >
                    复制
                  </Button>
                </span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.label}>小端（little-endian）</span>
                <span className={`${styles.value} ${styles.mono}`}>
                  {formatBytes(integerResult.littleEndian!)}
                </span>
                <span className={styles.sub}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(formatBytes(integerResult.littleEndian!))}
                  >
                    复制
                  </Button>
                </span>
              </div>
            </div>
          </Card>
        )
      ) : null}

      <Alert
        type="info"
        showIcon
        message="端序说明"
        description={
          <div className={styles.hint}>
            <p>
              大端把最高有效字节放在序列最前，小端相反。有符号整数按二进制补码解释，
              16 位 <span className={styles.mono}>0x8000</span> 即 -32768、
              <span className={styles.mono}>0xFFFF</span> 即 -1。
            </p>
            <p>
              半字交换按 16 位为单位两两互换（如 <span className={styles.mono}>12 34 56 78</span> →
              <span className={styles.mono}> 34 12 78 56</span>），整串反转则把全部字节倒序。
              64 位运算使用 BigInt，不会因 JavaScript 安全整数上限而丢失精度。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default EndiannessConverter;
