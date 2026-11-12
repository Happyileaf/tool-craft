'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, Tree, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildBerTlvList,
  bytesToHex,
  flattenNodes,
  parseBerTlv,
  type TlvBuildInput,
  type TlvNode,
} from './utils/tlv';
import {
  DEFAULT_BUILD_INPUT,
  DEFAULT_PARSE_INPUT,
  MODE_OPTIONS,
  TAG_PRESETS,
  TLV_PLACEHOLDER,
  TlvMode,
} from './constants';
import styles from './index.module.css';

/** 把 TLV 节点转换为 antd Tree 数据 */
function toTreeData(node: TlvNode, key: string): DataNode {
  return {
    key,
    title: (
      <Space size={6} wrap>
        <code className={styles.tagHex}>{node.tag}</code>
        <Tag color={node.constructed ? 'geekblue' : 'default'}>
          {node.constructed ? '构造型' : '原始型'}
        </Tag>
        <Tag>{node.tagClass}</Tag>
        {node.indefinite && <Tag color="orange">不定长</Tag>}
        <span className={styles.valueText}>
          {node.constructed ? `${node.children.length} 个子 TLV` : node.valueHex || '（空值）'}
        </span>
      </Space>
    ),
    children: node.children.map((child, index) => toTreeData(child, `${key}-${index}`)),
  };
}

/**
 * BER-TLV 嵌套标签-长度-值解析与构造工具，全部在浏览器本地完成
 */
const BerTlvCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<TlvMode>('parse');
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_PARSE_INPUT);
  const [jsonInput, setJsonInput] = React.useState<string>(DEFAULT_BUILD_INPUT);

  const parseResult = React.useMemo(() => {
    try {
      const nodes = parseBerTlv(hexInput);
      return { nodes, error: null as string | null };
    } catch (caught) {
      return { nodes: [], error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput]);

  const buildResult = React.useMemo(() => {
    try {
      const parsed = JSON.parse(jsonInput) as TlvBuildInput[];
      if (!Array.isArray(parsed)) {
        throw new Error('顶层必须是 TLV 对象数组');
      }
      const bytes = buildBerTlvList(parsed);
      return { hex: bytesToHex(bytes), error: null as string | null };
    } catch (caught) {
      return { hex: '', error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [jsonInput]);

  const flatRows = React.useMemo(
    () =>
      flattenNodes(parseResult.nodes).map((row, index) => ({
        key: `${index}`,
        depth: row.depth,
        tag: row.node.tag,
        kind: row.node.constructed ? '构造型' : '原始型',
        length: row.node.value.length,
        value: row.node.constructed ? '—' : row.node.valueHex || '（空）',
      })),
    [parseResult.nodes],
  );

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="BER-TLV 嵌套标签长度值解析与构造器（EMV / SIM APDU）">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as TlvMode)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={MODE_OPTIONS}
        />

        {mode === 'parse' ? (
          <>
            <span className={styles.label}>BER-TLV 十六进制</span>
            <Input.TextArea
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              rows={4}
              className={styles.inputArea}
              placeholder={TLV_PLACEHOLDER}
            />
            <Space wrap style={{ margin: '10px 0' }}>
              {TAG_PRESETS.map((preset) => (
                <Tag
                  key={preset.label}
                  color="blue"
                  className={styles.presetTag}
                  onClick={() => setHexInput(preset.hex)}
                >
                  {preset.label}
                </Tag>
              ))}
            </Space>
          </>
        ) : (
          <>
            <span className={styles.label}>结构化输入（JSON 数组，tag + value 或 children）</span>
            <Input.TextArea
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              rows={10}
              className={styles.inputArea}
            />
          </>
        )}

        <Space wrap style={{ marginBottom: 12 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setHexInput(DEFAULT_PARSE_INPUT);
              setJsonInput(DEFAULT_BUILD_INPUT);
            }}
          >
            重置示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setHexInput('');
              setJsonInput('');
            }}
          >
            清空
          </Button>
        </Space>

        {mode === 'parse' ? (
          parseResult.error ? (
            <Alert type="error" showIcon message="解析失败" description={parseResult.error} />
          ) : (
            <div className={styles.resultCard}>
              <Tree
                defaultExpandAll
                treeData={parseResult.nodes.map((node, index) => toTreeData(node, `root-${index}`))}
                className={styles.tree}
              />
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={flatRows}
                columns={[
                  { title: '层级', dataIndex: 'depth', key: 'depth', width: 70 },
                  { title: 'Tag', dataIndex: 'tag', key: 'tag', width: 110 },
                  { title: '类型', dataIndex: 'kind', key: 'kind', width: 100 },
                  { title: '长度', dataIndex: 'length', key: 'length', width: 80 },
                  { title: 'Value（十六进制）', dataIndex: 'value', key: 'value' },
                ]}
              />
            </div>
          )
        ) : buildResult.error ? (
          <Alert type="error" showIcon message="构造失败" description={buildResult.error} />
        ) : (
          <div className={styles.resultCard}>
            <div className={styles.outputRow}>
              <span className={styles.resultName}>输出 TLV</span>
              <code className={styles.outputHex}>{buildResult.hex}</code>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(buildResult.hex)}>
                复制
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="Tag 与 Length 编码规则"
        description={
          <div className={styles.hint}>
            <p>
              Tag 首字节高 2 位表示类别（universal/application/context-specific/private），bit6
              为构造位（1 表示该 TLV 内含子 TLV），低 5 位全为 1（0x1F）时表示多字节 Tag，后续字节以最高位作为续位标志。
            </p>
            <p>
              Length 小于 128 用单字节短形式；首字节为 0x80 表示不定长，构造型内容以两个零字节
              00 00（End-of-Contents）结束；首字节大于 0x80 时低 7 位给出后续长度字节数，按大端拼接真实长度。所有解析与构造均在本机浏览器完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default BerTlvCodec;
