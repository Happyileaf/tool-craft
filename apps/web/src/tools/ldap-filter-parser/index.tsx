'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Space, Table, Tag, Tree, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  countItems,
  parseLdapFilter,
  walkFilter,
  type FilterItem,
  type FilterNode,
} from './utils/ldap';
import { DEFAULT_FILTER, FILTER_PLACEHOLDER, FILTER_PRESETS } from './constants';
import styles from './index.module.css';

const LOGIC_META: Record<string, { label: string; color: string }> = {
  and: { label: 'AND 与 (&)', color: 'geekblue' },
  or: { label: 'OR 或 (|)', color: 'purple' },
  not: { label: 'NOT 非 (!)', color: 'volcano' },
};

/** 把 AST 节点转换为 antd Tree 需要的 DataNode 结构 */
function toTreeData(node: FilterNode, keyPrefix: string): DataNode {
  const key = keyPrefix;
  if (node.kind === 'item') {
    const opText = node.presence
      ? '=* 存在'
      : node.substrings
        ? `= 子串 ${node.operator}`
        : node.operator;
    return {
      key,
      title: (
        <Space size={6} wrap>
          <Tag color="cyan">叶子</Tag>
          <code className={styles.attrName}>{node.attribute}</code>
          <Tag>{opText}</Tag>
          <code className={styles.attrValue}>{node.value}</code>
        </Space>
      ),
    };
  }
  const meta = LOGIC_META[node.kind]!;
  return {
    key,
    title: (
      <Tag color={meta.color} className={styles.logicTag}>
        {meta.label}
      </Tag>
    ),
    children: node.children.map((child, index) => toTreeData(child, `${key}-${index}`)),
  };
}

/**
 * LDAP 搜索过滤器（RFC 4515）解析、校验与语法树可视化工具，
 * 全部解析在浏览器本地完成
 */
const LdapFilterParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [filter, setFilter] = React.useState<string>(defaultInput || DEFAULT_FILTER);

  const result = React.useMemo(() => {
    try {
      const parsed = parseLdapFilter(filter);
      return { parsed, error: null as string | null };
    } catch (caught) {
      return { parsed: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [filter]);

  const flatRows = React.useMemo(() => {
    if (!result.parsed) {
      return [];
    }
    const rows: Array<{ key: string; depth: number; type: string; detail: string }> = [];
    walkFilter(result.parsed.root, (node, depth) => {
      if (node.kind === 'item') {
        const item = node as FilterItem;
        rows.push({
          key: `${rows.length}`,
          depth,
          type: '叶子断言',
          detail: `${item.attribute} ${item.operator} ${item.value}`,
        });
      } else {
        rows.push({
          key: `${rows.length}`,
          depth,
          type: LOGIC_META[node.kind]!.label,
          detail: `${node.children.length} 个子节点`,
        });
      }
    });
    return rows;
  }, [result.parsed]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const reset = (): void => setFilter(DEFAULT_FILTER);

  return (
    <div className={styles.container}>
      <Card title="LDAP 搜索过滤器解析与校验器（RFC 4515）">
        <span className={styles.label}>过滤器表达式</span>
        <Input.TextArea
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          rows={4}
          className={styles.inputArea}
          placeholder={FILTER_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          {FILTER_PRESETS.map((preset) => (
            <Tag
              key={preset.label}
              color="blue"
              className={styles.presetTag}
              onClick={() => setFilter(preset.filter)}
            >
              {preset.label}
            </Tag>
          ))}
        </Space>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={reset}>
            重置示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setFilter('')}>
            清空
          </Button>
        </Space>

        {result.error ? (
          <Alert type="error" showIcon message="语法校验失败" description={result.error} />
        ) : (
          result.parsed && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={3} bordered>
                <Descriptions.Item label="校验结果">
                  <Tag color="green">合法</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="叶子断言数">
                  {countItems(result.parsed.root)}
                </Descriptions.Item>
                <Descriptions.Item label="最大嵌套深度">
                  {Math.max(...flatRows.map((row) => row.depth)) + 1}
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.normalizedRow}>
                <span className={styles.resultName}>规范化文本</span>
                <code className={styles.normalizedText}>{result.parsed.normalized}</code>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(result.parsed!.normalized)}
                >
                  复制
                </Button>
              </div>

              <div className={styles.treeSection}>
                <span className={styles.resultName}>语法树</span>
                <Tree
                  defaultExpandAll
                  treeData={[toTreeData(result.parsed.root, 'root')]}
                  className={styles.tree}
                />
              </div>

              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={flatRows}
                columns={[
                  { title: '层级', dataIndex: 'depth', key: 'depth', width: 80 },
                  { title: '节点类型', dataIndex: 'type', key: 'type', width: 160 },
                  { title: '内容', dataIndex: 'detail', key: 'detail' },
                ]}
              />
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="语法与转义说明"
        description={
          <div className={styles.hint}>
            <p>
              RFC 4515 过滤器以括号包裹，比较项形如 (属性操作符断言值)，支持 =、&gt;=、&lt;=、~=
              四种操作符；(attr=*) 表示存在性断言，值中的 * 构成子串匹配（前缀*包含*后缀）。
              逻辑组合使用 &（与）、|（或）、!（非）前缀，其中 ! 只能包裹一个子过滤器。
            </p>
            <p>
              断言值里的 *、(、)、\ 与空字节必须写成 \HH 两位十六进制转义，非 ASCII
              字符按 UTF-8 字节转义。本工具在浏览器本地完成解析、校验与 AST
              可视化，不向任何服务器发送数据。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default LdapFilterParser;
