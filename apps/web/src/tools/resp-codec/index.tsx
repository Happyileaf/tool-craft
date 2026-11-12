'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Statistic, Table, Tag, Tree, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  TYPE_LABELS,
  encodeInlineToResp,
  encodeValue,
  parseResp,
  type RespNode,
} from './utils/resp';
import {
  DEFAULT_INLINE_INPUT,
  DEFAULT_PARSE_INPUT,
  DEFAULT_VALUE_INPUT,
  MODE_OPTIONS,
  PARSE_PRESETS,
  RESP_PLACEHOLDER,
  type RespMode,
} from './constants';
import styles from './index.module.css';

const TYPE_COLORS: Record<RespNode['type'], string> = {
  'simple-string': 'green',
  error: 'red',
  integer: 'blue',
  'bulk-string': 'cyan',
  array: 'geekblue',
  null: 'default',
  double: 'purple',
  boolean: 'gold',
  'bulk-error': 'volcano',
  'verbatim-string': 'magenta',
  'big-number': 'orange',
  set: 'lime',
  map: 'geekblue',
  push: 'pink',
};

interface FlatRow {
  key: string;
  depth: number;
  prefix: string;
  type: string;
  value: string;
}

/** 统计节点总数（含容器与叶子） */
function countNodes(nodes: RespNode[]): number {
  return nodes.reduce((sum, node) => {
    if (node.entries) {
      return (
        sum +
        1 +
        node.entries.reduce(
          (inner, [key, val]) => inner + countNodes([key]) + countNodes([val]),
          0,
        )
      );
    }
    if (node.children) {
      return sum + 1 + countNodes(node.children);
    }
    return sum + 1;
  }, 0);
}

/** 把节点拍平成表格行 */
function flatten(nodes: RespNode[], depth = 0, prefix = 'r'): FlatRow[] {
  const rows: FlatRow[] = [];
  nodes.forEach((node, index) => {
    const key = `${prefix}-${index}`;
    const value =
      node.value === null
        ? '（null）'
        : node.verbatimEncoding
          ? `[${node.verbatimEncoding}] ${node.value}`
          : node.value || '（空）';
    rows.push({ key, depth, prefix: node.prefix, type: TYPE_LABELS[node.type], value });
    if (node.entries) {
      node.entries.forEach(([entryKey, entryValue], entryIndex) => {
        rows.push(...flatten([entryKey, entryValue], depth + 1, `${key}-e${entryIndex}`));
      });
    } else if (node.children) {
      rows.push(...flatten(node.children, depth + 1, key));
    }
  });
  return rows;
}

/** 把 RESP 节点转换为 antd Tree 数据 */
function toTreeData(node: RespNode, key: string): DataNode {
  const valueText =
    node.value === null
      ? 'null'
      : node.verbatimEncoding
        ? `[${node.verbatimEncoding}] ${node.value}`
        : node.value;
  return {
    key,
    title: (
      <Space size={6} wrap>
        <code className={styles.prefix}>{node.prefix}</code>
        <Tag color={TYPE_COLORS[node.type]}>{TYPE_LABELS[node.type]}</Tag>
        <span className={styles.valueText}>{valueText}</span>
      </Space>
    ),
    children: node.entries
      ? node.entries.flatMap(([entryKey, entryValue], index) => [
          toTreeData(entryKey, `${key}-k${index}`),
          toTreeData(entryValue, `${key}-v${index}`),
        ])
      : node.children?.map((child, index) => toTreeData(child, `${key}-${index}`)),
  };
}

/**
 * Redis RESP2/RESP3 协议解析与编码工具，全部在浏览器本地完成
 */
const RespCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<RespMode>('parse');
  const [parseInput, setParseInput] = React.useState<string>(
    defaultInput || DEFAULT_PARSE_INPUT,
  );
  const [inlineInput, setInlineInput] = React.useState<string>(DEFAULT_INLINE_INPUT);
  const [valueInput, setValueInput] = React.useState<string>(DEFAULT_VALUE_INPUT);

  const parseResult = React.useMemo(() => {
    try {
      const nodes = parseResp(parseInput);
      return {
        nodes,
        error: null as string | null,
        total: countNodes(nodes),
        rows: flatten(nodes),
      };
    } catch (caught) {
      return {
        nodes: [],
        error: caught instanceof Error ? caught.message : '解析失败',
        total: 0,
        rows: [] as FlatRow[],
      };
    }
  }, [parseInput]);

  const inlineResult = React.useMemo(() => {
    try {
      return { wire: encodeInlineToResp(inlineInput), error: null as string | null };
    } catch (caught) {
      return { wire: '', error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [inlineInput]);

  const valueResult = React.useMemo(() => {
    try {
      const value = JSON.parse(valueInput) as unknown;
      return { wire: encodeValue(value), error: null as string | null };
    } catch (caught) {
      return { wire: '', error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [valueInput]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const reset = (): void => {
    setParseInput(DEFAULT_PARSE_INPUT);
    setInlineInput(DEFAULT_INLINE_INPUT);
    setValueInput(DEFAULT_VALUE_INPUT);
  };

  const clear = (): void => {
    setParseInput('');
    setInlineInput('');
    setValueInput('');
  };

  const renderWireOutput = (result: { wire: string; error: string | null }): React.ReactNode =>
    result.error ? (
      <Alert type="error" showIcon message="编码失败" description={result.error} />
    ) : (
      <div className={styles.resultCard}>
        <div className={styles.outputRow}>
          <span className={styles.resultName}>RESP 输出</span>
          <code className={styles.outputText}>{result.wire}</code>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(result.wire)}>
            复制
          </Button>
        </div>
        <pre className={styles.rawBlock}>{result.wire}</pre>
      </div>
    );

  return (
    <div className={styles.container}>
      <Card title="Redis RESP2 / RESP3 协议解析与编码器">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as RespMode)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={MODE_OPTIONS}
        />

        {mode === 'parse' ? (
          <>
            <span className={styles.label}>RESP 协议文本</span>
            <Input.TextArea
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
              rows={6}
              className={styles.inputArea}
              placeholder={RESP_PLACEHOLDER}
            />
            <Space wrap style={{ margin: '10px 0' }}>
              {PARSE_PRESETS.map((preset) => (
                <Tag
                  key={preset.label}
                  color="blue"
                  className={styles.presetTag}
                  onClick={() => setParseInput(preset.payload)}
                >
                  {preset.label}
                </Tag>
              ))}
            </Space>
          </>
        ) : mode === 'inline' ? (
          <>
            <span className={styles.label}>Inline 命令（空格分词，支持双引号）</span>
            <Input
              value={inlineInput}
              onChange={(event) => setInlineInput(event.target.value)}
              className={styles.inputArea}
              placeholder="例如：SET key value"
            />
          </>
        ) : (
          <>
            <span className={styles.label}>JSON 值（对象、数组、数字、布尔、null）</span>
            <Input.TextArea
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              rows={8}
              className={styles.inputArea}
            />
          </>
        )}

        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={reset}>
            重置示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={clear}>
            清空
          </Button>
        </Space>

        {mode === 'parse' ? (
          parseResult.error ? (
            <Alert type="error" showIcon message="解析失败" description={parseResult.error} />
          ) : (
            <div className={styles.resultCard}>
              <Space size="large">
                <Statistic title="顶层消息数" value={parseResult.nodes.length} />
                <Statistic title="节点总数" value={parseResult.total} />
              </Space>
              <Tree
                defaultExpandAll
                treeData={parseResult.nodes.map((node, index) =>
                  toTreeData(node, `root-${index}`),
                )}
                className={styles.tree}
              />
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={parseResult.rows}
                columns={[
                  { title: '层级', dataIndex: 'depth', key: 'depth', width: 70 },
                  { title: '前缀', dataIndex: 'prefix', key: 'prefix', width: 70 },
                  { title: '类型', dataIndex: 'type', key: 'type', width: 130 },
                  { title: '值 / 载荷', dataIndex: 'value', key: 'value' },
                ]}
              />
            </div>
          )
        ) : mode === 'inline' ? (
          renderWireOutput(inlineResult)
        ) : (
          renderWireOutput(valueResult)
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="RESP 协议要点"
        description={
          <div className={styles.hint}>
            <p>
              RESP（REdis Serialization Protocol）以类型前缀加 CRLF（\r\n）组织数据：RESP2
              提供 + 简单字符串、- 错误、: 整数、$ 批量字符串、* 数组五种类型，其中 $-1 与
              *-1 表示空值。
            </p>
            <p>
              RESP3 在其之上扩展了 _ null、, 双精度浮点、# 布尔、! 批量错误、= 逐字字符串、(
              大整数、~ 集合、| 字典、&gt; Push 等类型，可直接表达 Map、Set
              等富结构。所有解析与编码均在本机浏览器完成，不会发送任何数据。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default RespCodec;
