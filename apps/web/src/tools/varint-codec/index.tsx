'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  bytesToHex,
  bytesToSpacedHex,
  decodeVarInt,
  encodeVarInt,
  hexToBytes,
  parseIntegerInput,
  type VarIntByte,
  type VarIntType,
} from './utils/varint';
import {
  CodecDirectionEnum,
  DEFAULT_HEX,
  DEFAULT_INTEGER,
  VARINT_TYPE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 逐字节表格列定义 */
const BYTE_COLUMNS: ColumnsType<VarIntByte> = [
  { title: '#', dataIndex: 'index', width: 48 },
  {
    title: '十六进制',
    dataIndex: 'hex',
    width: 96,
    render: (hex: string) => <code className={styles.mono}>{hex}</code>,
  },
  {
    title: '二进制',
    dataIndex: 'binary',
    width: 120,
    render: (binary: string, record) => (
      <span className={styles.mono}>
        <span className={record.continuation ? styles.contBit : styles.signBit}>
          {binary.charAt(0)}
        </span>
        <span className={styles.payloadBits}>{binary.slice(1)}</span>
      </span>
    ),
  },
  {
    title: '续位 MSB',
    dataIndex: 'continuation',
    width: 100,
    render: (continuation: boolean) =>
      continuation ? <Tag color="orange">1 后续有字节</Tag> : <Tag color="green">0 末字节</Tag>,
  },
  {
    title: '7 位载荷',
    key: 'payload',
    render: (_, record) => (
      <span className={styles.mono}>
        {record.payloadBinary} = {record.payload} (0x{record.hex})
      </span>
    ),
  },
];

/**
 * VarInt / ZigZag / LEB128 编解码工具。
 *
 * 支持 Protocol Buffers 的 Base-128 无符号 VarInt、sint32 / sint64 的 ZigZag
 * 映射以及 DWARF / WASM 使用的有符号 LEB128，提供整数 ↔ 十六进制双向转换与
 * 逐字节可视化（续位标记、7 位载荷分组）。全部运算在浏览器本地完成。
 *
 * @returns VarInt 编解码交互界面
 */
const VarIntCodec: React.FC<ToolComponentProps> = () => {
  const [type, setType] = React.useState<VarIntType>('unsigned');
  const [direction, setDirection] = React.useState<CodecDirectionEnum>(
    CodecDirectionEnum.ENCODE,
  );
  const [integerInput, setIntegerInput] = React.useState<string>(DEFAULT_INTEGER);
  const [hexInput, setHexInput] = React.useState<string>(DEFAULT_HEX);

  // 编码：整数 → 字节
  const encodeResult = React.useMemo(() => {
    const parsed = parseIntegerInput(integerInput);
    if (parsed.error || parsed.value === null) {
      return { output: '', bytesDetail: [] as VarIntByte[], error: parsed.error };
    }
    const encoded = encodeVarInt(parsed.value, type);
    return {
      output: encoded.bytes ? bytesToSpacedHex(encoded.bytes) : '',
      compactHex: encoded.bytes ? bytesToHex(encoded.bytes) : '',
      bytesDetail: encoded.bytesDetail,
      error: encoded.error,
    };
  }, [integerInput, type]);

  // 解码：字节 → 整数
  const decodeResult = React.useMemo(() => {
    const parsedHex = hexToBytes(hexInput);
    if (parsedHex.error || !parsedHex.bytes) {
      return { output: '', bytesDetail: [] as VarIntByte[], error: parsedHex.error };
    }
    if (parsedHex.bytes.length === 0) {
      return { output: '', bytesDetail: [] as VarIntByte[], error: '请输入十六进制字节' };
    }
    const decoded = decodeVarInt(parsedHex.bytes, type);
    return {
      output: decoded.value === null ? '' : decoded.value.toString(),
      unsignedHex:
        decoded.value === null ? '' : `0x${decoded.value.toString(16).toUpperCase()}`,
      bytesDetail: decoded.bytes,
      length: decoded.length,
      totalBytes: parsedHex.bytes.length,
      error: decoded.error,
    };
  }, [hexInput, type]);

  const current = direction === CodecDirectionEnum.ENCODE ? encodeResult : decodeResult;
  const isEncode = direction === CodecDirectionEnum.ENCODE;

  /**
   * 复制结果文本
   *
   * @param value - 待复制内容
   */
  const handleCopy = async (value: string) => {
    if (!value) {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="VarInt / ZigZag / LEB128 编解码">
        <div className={styles.toolbar}>
          <div className={styles.field}>
            <span className={styles.label}>编码类型</span>
            <Select
              value={type}
              onChange={(value) => setType(value)}
              options={VARINT_TYPE_OPTIONS}
              style={{ width: 300 }}
            />
          </div>
        </div>
        <div className={styles.hint}>
          Base-128 VarInt 每字节低 7 位为载荷、最高位（MSB）为续位标记：橙色 1
          表示后续还有字节，绿色 0 表示末字节。有符号整数经 ZigZag 映射（sint32 /
          sint64）或直接使用有符号 LEB128（符号位在第 6 位 0x40）编码。
        </div>
      </Card>

      <Card
        title={isEncode ? '输入整数（十进制或 0x 十六进制，支持负数）' : '输入字节（十六进制）'}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => (isEncode ? setIntegerInput(DEFAULT_INTEGER) : setHexInput(DEFAULT_HEX))}
            >
              载入示例
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => (isEncode ? setIntegerInput('') : setHexInput(''))}
            >
              清空
            </Button>
          </Space>
        }
        className={styles.card}
      >
        <Radio.Group
          value={direction}
          onChange={(event) => setDirection(event.target.value as CodecDirectionEnum)}
          optionType="button"
          options={[
            { label: '编码（整数 → 字节）', value: CodecDirectionEnum.ENCODE },
            { label: '解码（字节 → 整数）', value: CodecDirectionEnum.DECODE },
          ]}
          style={{ marginBottom: 12 }}
        />
        {isEncode ? (
          <Input.TextArea
            value={integerInput}
            onChange={(event) => setIntegerInput(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder="输入整数，如 300、-1 或 0x12C；支持逗号 / 下划线分隔"
          />
        ) : (
          <Input.TextArea
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder="输入十六进制字节，如 AC 02；允许 0x 前缀、空格与逗号分隔"
          />
        )}
      </Card>

      <Card
        title={isEncode ? '编码结果（十六进制）' : '解码结果（十进制整数）'}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(current.output)}
            disabled={Boolean(current.error) || !current.output}
          >
            复制结果
          </Button>
        }
        className={styles.card}
      >
        {current.error ? (
          <Alert type="error" showIcon message="无法处理" description={current.error} />
        ) : (
          <Input.TextArea value={current.output} readOnly autoSize={{ minRows: 2, maxRows: 6 }} />
        )}
        {!isEncode && !current.error && 'unsignedHex' in current && current.unsignedHex && (
          <div className={styles.meta}>{`十六进制：${current.unsignedHex}`}</div>
        )}
        {!isEncode && !current.error && 'length' in current && current.length !== undefined && (
          <div className={styles.meta}>
            {`消费字节数：${current.length}`}
            {current.totalBytes !== undefined && current.totalBytes > current.length
              ? `（输入共 ${current.totalBytes} 字节，仅前 ${current.length} 字节属于该 VarInt）`
              : ''}
          </div>
        )}
      </Card>

      {!current.error && current.bytesDetail.length > 0 && (
        <Card title="逐字节拆解" className={styles.card}>
          <Table<VarIntByte>
            rowKey="index"
            columns={BYTE_COLUMNS}
            dataSource={current.bytesDetail}
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default VarIntCodec;
