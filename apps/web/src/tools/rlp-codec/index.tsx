'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Table, Tag, message } from 'antd';
import {
  bytesToHex,
  countNodes,
  decode,
  encode,
  hexItem,
  tryUtf8,
  utf8Item,
  type RlpDecoded,
  type RlpInput,
} from './utils/rlp';
import { SAMPLE_DECODE_HEX, SAMPLE_ENCODE_INPUT, TYPE_COLORS, TYPE_LABELS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 将 JSON 输入转换为 RLP 输入树：
 * 普通字符串 → UTF-8；["hex", "0x.."] → 原始字节；数组 → 列表。
 */
function jsonToRlp(value: unknown): RlpInput {
  if (typeof value === 'string') return utf8Item(value);
  if (Array.isArray(value)) {
    if (value.length === 2 && value[0] === 'hex' && typeof value[1] === 'string') {
      return hexItem(value[1]);
    }
    return value.map((item) => jsonToRlp(item));
  }
  throw new Error('仅支持字符串、["hex", "0x.."] 标记与数组；数字 / 对象请先转成十六进制字符串');
}

function TreeNode({ node }: { node: RlpDecoded }) {
  if (node.kind === 'string') {
    const text = tryUtf8(node.data);
    return (
      <div className={styles.treeNode}>
        <div className={styles.treeRow}>
          <span className={styles.offset}>@{node.offset}</span>
          <Tag color={TYPE_COLORS[node.type]}>{TYPE_LABELS[node.type]}</Tag>
          <span className={styles.mono}>{bytesToHex(node.data)}</span>
          {text !== null && node.data.length > 0 && (
            <span style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>= {JSON.stringify(text)}</span>
          )}
          <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 11 }}>len={node.length}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.treeNode}>
      <div className={styles.treeRow}>
        <span className={styles.offset}>@{node.offset}</span>
        <Tag color={TYPE_COLORS[node.type]}>{TYPE_LABELS[node.type]}</Tag>
        <span style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>
          {node.items.length} 项 · payload len={node.length}
        </span>
      </div>
      <div className={styles.treeChildren}>
        {node.items.map((child, i) => (
          <TreeNode key={`${child.offset}-${i}`} node={child} />
        ))}
      </div>
    </div>
  );
}

function flatten(node: RlpDecoded, depth: number, rows: Array<{
  key: string;
  depth: number;
  type: string;
  hex: string;
  text: string | null;
  length: number;
  offset: number;
}>): void {
  const key = `${node.offset}-${depth}-${Math.random()}`;
  if (node.kind === 'string') {
    rows.push({
      key,
      depth,
      type: node.type,
      hex: bytesToHex(node.data),
      text: tryUtf8(node.data),
      length: node.length,
      offset: node.offset,
    });
  } else {
    rows.push({ key, depth, type: node.type, hex: '', text: null, length: node.length, offset: node.offset });
    node.items.forEach((child) => flatten(child, depth + 1, rows));
  }
}

const RlpCodec: React.FC<ToolComponentProps> = () => {
  const [encodeText, setEncodeText] = React.useState(SAMPLE_ENCODE_INPUT);
  const [decodeText, setDecodeText] = React.useState(SAMPLE_DECODE_HEX);

  const encoded = React.useMemo<{ hex?: Uint8Array; error?: string }>(() => {
    if (encodeText.trim() === '') return {};
    try {
      const parsed: unknown = JSON.parse(encodeText);
      return { hex: encode(jsonToRlp(parsed)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [encodeText]);

  const decoded = React.useMemo<{ node?: RlpDecoded; error?: string }>(() => {
    if (decodeText.trim() === '') return {};
    try {
      return { node: decode(decodeText) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [decodeText]);

  const flatRows = React.useMemo(() => {
    if (!decoded.node) return [];
    const rows: Parameters<typeof flatten>[2] = [];
    flatten(decoded.node, 0, rows);
    return rows;
  }, [decoded.node]);

  return (
    <div className={styles.container}>
      <Card
        title="RLP 编码（JSON → 十六进制）"
        extra={
          <Space>
            <Button size="small" onClick={() => setEncodeText(SAMPLE_ENCODE_INPUT)}>
              示例
            </Button>
            <Button
              size="small"
              type="primary"
              disabled={!encoded.hex}
              onClick={() => {
                if (encoded.hex) {
                  copyToClipboard(bytesToHex(encoded.hex));
                  message.success('已复制 RLP 十六进制');
                }
              }}
            >
              复制结果
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          按 JSON 描述输入：普通字符串按 UTF-8 编码；<code>["hex", "0x.."]</code> 按原始字节（用于地址 /
          数值等）；数组即 RLP 列表，可嵌套。空串 <code>""</code> → 0x80，空数组 <code>[]</code> → 0xc0。
        </p>
        <Input.TextArea
          className={styles.mono}
          value={encodeText}
          onChange={(e) => setEncodeText(e.target.value)}
          autoSize={{ minRows: 6, maxRows: 16 }}
          spellCheck={false}
        />
        {encoded.error ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="输入有误" description={encoded.error} />
        ) : encoded.hex ? (
          <div style={{ marginTop: 12 }}>
            <div className={styles.hexBlock}>{bytesToHex(encoded.hex)}</div>
            <Space style={{ marginTop: 8 }} size="large">
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                总字节数：{encoded.hex.length}
              </span>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  if (encoded.hex) setDecodeText(bytesToHex(encoded.hex));
                }}
              >
                送到下方解码 ↓
              </Button>
            </Space>
          </div>
        ) : null}
      </Card>

      <Card
        title="RLP 解码（十六进制 → 结构化树）"
        extra={
          <Space>
            <Button size="small" onClick={() => setDecodeText(SAMPLE_DECODE_HEX)}>
              示例
            </Button>
            <Button
              size="small"
              disabled={!decoded.node}
              onClick={() => {
                if (decoded.node) {
                  copyToClipboard(JSON.stringify(decoded.node, null, 2));
                  message.success('已复制解码树 JSON');
                }
              }}
            >
              复制 JSON
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          输入 0x 开头的 RLP 十六进制。严格按以太坊黄皮书校验：截断、尾字节残留、长度前导零、短格式误用
          （如 0x817f）等非规范编码都会报错并给出字节偏移；嵌套深度上限 64。
        </p>
        <Input
          className={styles.mono}
          value={decodeText}
          onChange={(e) => setDecodeText(e.target.value)}
          placeholder="0xc88363617483646f67"
          spellCheck={false}
        />
        {decoded.error ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="解码失败" description={decoded.error} />
        ) : decoded.node ? (
          <div style={{ marginTop: 12 }}>
            <Space style={{ marginBottom: 8 }} size="large">
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                节点总数：{countNodes(decoded.node)}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                根类型：{TYPE_LABELS[decoded.node.type]}
              </span>
            </Space>
            <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12 }}>
              <TreeNode node={decoded.node} />
            </div>
            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              dataSource={flatRows}
              columns={[
                {
                  title: '深度',
                  dataIndex: 'depth',
                  width: 70,
                  render: (d: number) => <Tag>{d}</Tag>,
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  width: 110,
                  render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t]}</Tag>,
                },
                {
                  title: '偏移',
                  dataIndex: 'offset',
                  width: 80,
                  render: (o: number) => <span className={styles.mono}>{o}</span>,
                },
                {
                  title: '长度',
                  dataIndex: 'length',
                  width: 90,
                  render: (l: number) => <span className={styles.mono}>{l}</span>,
                },
                {
                  title: '数据 (hex)',
                  dataIndex: 'hex',
                  render: (hex: string) =>
                    hex ? (
                      <span className={styles.mono} style={{ wordBreak: 'break-all' }}>
                        {hex}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(0,0,0,0.35)' }}>— 列表 —</span>
                    ),
                },
                {
                  title: 'UTF-8',
                  dataIndex: 'text',
                  width: 160,
                  render: (t: string | null) =>
                    t ? <span style={{ fontSize: 12 }}>{JSON.stringify(t)}</span> : null,
                },
              ]}
            />
          </div>
        ) : null}
      </Card>

      <Card title="长度前缀速查">
        <Table
          size="small"
          pagination={false}
          showHeader={false}
          dataSource={[
            { k: '0x00–0x7f', v: '单字节字符串（值即其自身）' },
            { k: '0x80', v: '空字符串；0x80+L：0–55 字节字符串' },
            { k: `0xb7+N …`, v: '长字符串：后 N 字节为 payload 长度的大端表示（>55）' },
            { k: '0xc0', v: '空列表；0xc0+L：payload 0–55 字节的列表' },
            { k: '0xf7+N …', v: '长列表：后 N 字节为 payload 长度的大端表示（>55）' },
          ]}
          rowKey="k"
          columns={[
            { dataIndex: 'k', width: 120, render: (v: string) => <span className={styles.mono}>{v}</span> },
            { dataIndex: 'v' },
          ]}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>
          示例：长度 1024=0x0400 的字符串前缀为 0xb9 0x04 0x00；{`beLength(256) = [0x01, 0x00]`}。
        </p>
      </Card>
    </div>
  );
};

export default RlpCodec;
