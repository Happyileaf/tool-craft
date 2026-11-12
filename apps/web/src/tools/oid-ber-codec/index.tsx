'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  bytesToHex,
  decodeOidTlv,
  encodeOidTlv,
  parseDottedOid,
  parseHexBytes,
} from './utils/oid';
import {
  CodecMode,
  DEFAULT_DOTTED_INPUT,
  DEFAULT_HEX_INPUT,
  HEX_PLACEHOLDER,
  MODE_OPTIONS,
  OID_PRESETS,
} from './constants';
import styles from './index.module.css';

interface EncodeOutput {
  tlvHex: string;
  contentHex: string;
  totalBytes: number;
  arcs: number[];
}

/**
 * OID 点分十进制与 BER OBJECT IDENTIFIER 双向编解码工具，
 * 全部计算在浏览器本地完成
 */
const OidBerCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecMode>('encode');
  const [dotted, setDotted] = React.useState<string>(defaultInput || DEFAULT_DOTTED_INPUT);
  const [hexInput, setHexInput] = React.useState<string>(DEFAULT_HEX_INPUT);

  const encodeResult = React.useMemo<{ data: EncodeOutput | null; error: string | null }>(() => {
    try {
      const arcs = parseDottedOid(dotted);
      const tlv = encodeOidTlv(dotted);
      const content = tlv.slice(2);
      return {
        data: {
          tlvHex: bytesToHex(tlv),
          contentHex: bytesToHex(content),
          totalBytes: tlv.length,
          arcs,
        },
        error: null,
      };
    } catch (caught) {
      return { data: null, error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [dotted]);

  const decodeResult = React.useMemo(() => {
    try {
      const bytes = parseHexBytes(hexInput);
      return { data: decodeOidTlv(hexInput), rawLength: bytes.length, error: null as string | null };
    } catch (caught) {
      return { data: null, rawLength: 0, error: caught instanceof Error ? caught.message : '解码失败' };
    }
  }, [hexInput]);

  const copy = async (text: string, label: string): Promise<void> => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const reset = (): void => {
    setMode('encode');
    setDotted(DEFAULT_DOTTED_INPUT);
    setHexInput(DEFAULT_HEX_INPUT);
  };

  const arcColumns = [
    { title: '弧序号', dataIndex: 'index', key: 'index', width: 90 },
    { title: '十进制值', dataIndex: 'value', key: 'value' },
  ];

  return (
    <div className={styles.container}>
      <Card title="OID 对象标识符 BER 编解码器（ITU-T X.690）">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as CodecMode)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={MODE_OPTIONS}
        />

        {mode === 'encode' ? (
          <div className={styles.formColumn}>
            <span className={styles.label}>点分十进制 OID</span>
            <Input.TextArea
              value={dotted}
              onChange={(event) => setDotted(event.target.value)}
              rows={3}
              className={styles.inputArea}
              placeholder="例如：1.2.840.113549.1.1.11"
            />
            <Space wrap>
              {OID_PRESETS.map((preset) => (
                <Tag
                  key={preset.dotted}
                  color="blue"
                  className={styles.presetTag}
                  onClick={() => setDotted(preset.dotted)}
                >
                  {preset.label}
                </Tag>
              ))}
            </Space>
          </div>
        ) : (
          <div className={styles.formColumn}>
            <span className={styles.label}>BER TLV 十六进制（含 Tag 0x06 与长度八位组）</span>
            <Input.TextArea
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              rows={3}
              className={styles.inputArea}
              placeholder={HEX_PLACEHOLDER}
            />
          </div>
        )}

        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={reset}>
            重置示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setDotted('');
              setHexInput('');
            }}
          >
            清空
          </Button>
        </Space>

        {mode === 'encode' ? (
          encodeResult.error ? (
            <Alert type="error" showIcon message="编码失败" description={encodeResult.error} />
          ) : (
            encodeResult.data && (
              <div className={styles.resultCard}>
                <div className={styles.resultRow}>
                  <span className={styles.resultName}>完整 TLV</span>
                  <code className={styles.resultHex}>{encodeResult.data.tlvHex}</code>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copy(encodeResult.data!.tlvHex, 'TLV ')}
                  >
                    复制
                  </Button>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultName}>内容字节（V）</span>
                  <code className={styles.resultHex}>{encodeResult.data.contentHex}</code>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultName}>总长度</span>
                  <span className={styles.resultDec}>{encodeResult.data.totalBytes} 字节</span>
                </div>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="index"
                  columns={arcColumns}
                  dataSource={encodeResult.data.arcs.map((value, index) => ({
                    index: index + 1,
                    value,
                  }))}
                />
              </div>
            )
          )
        ) : decodeResult.error ? (
          <Alert type="error" showIcon message="解码失败" description={decodeResult.error} />
        ) : (
          decodeResult.data && (
            <div className={styles.resultCard}>
              <div className={styles.resultRow}>
                <span className={styles.resultName}>点分十进制</span>
                <code className={styles.resultHex}>{decodeResult.data.dotted}</code>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(decodeResult.data!.dotted, 'OID ')}
                >
                  复制
                </Button>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultName}>内容字节（V）</span>
                <code className={styles.resultHex}>{decodeResult.data.contentHex}</code>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultName}>弧数量</span>
                <span className={styles.resultDec}>{decodeResult.data.arcs.length} 个</span>
              </div>
              <Table
                size="small"
                pagination={false}
                rowKey="index"
                columns={arcColumns}
                dataSource={decodeResult.data.arcs.map((value, index) => ({
                  index: index + 1,
                  value,
                }))}
              />
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="编码规则说明"
        description={
          <div className={styles.hint}>
            <p>
              BER（ITU-T X.690）把 OID 的前两个弧 (X, Y) 合并为 40×X+Y：首弧为 0 或 1
              时次弧须小于 40，首弧为 2 时次弧可任意大。其余每个弧按 base-128
              变长编码，每字节最高位为续位（1 表示后续还有字节），低 7 位承载数值。
            </p>
            <p>
              完整 TLV 由 Tag（固定 0x06）、长度八位组（小于 128 用短形式，否则用长形式
              0x80+n）与内容字节构成。所有解析与编码均在本机浏览器完成，无网络请求。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default OidBerCodec;
