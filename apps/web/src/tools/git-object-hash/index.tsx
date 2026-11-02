'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_FORMAT,
  DEFAULT_TYPE,
  FORMAT_OPTIONS,
  SAMPLE_INPUTS,
  TREE_MODE_HINT,
  TYPE_OPTIONS,
} from './constants';
import {
  buildTreeContent,
  hashBlob,
  hashTextObject,
  hashTree,
  type GitObjectType,
  type HashFormat,
  type TreeEntryInput,
} from './utils/git-object';
import styles from './index.module.css';

/**
 * Git 底层对象哈希计算器：在浏览器本地等价复现 git hash-object 的只读侧，
 * 支持 blob / tree / commit / annotated tag 与 SHA-1 / SHA-256。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 blob 文本
 * @returns Git 对象哈希交互界面
 */
const GitObjectHash: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [type, setType] = React.useState<GitObjectType>(DEFAULT_TYPE);
  const [format, setFormat] = React.useState<HashFormat>(DEFAULT_FORMAT);
  const [text, setText] = React.useState<string>(defaultInput || SAMPLE_INPUTS.blob);
  const [oid, setOid] = React.useState<string | null>(null);
  const [header, setHeader] = React.useState<string | null>(null);
  const [totalLength, setTotalLength] = React.useState<number>(0);
  const [entries, setEntries] = React.useState<TreeEntryInput[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [computing, setComputing] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;

    /**
     * 类型、格式或内容变化时重新计算；tree 额外解析排序后的条目用于展示
     */
    async function recompute() {
      if (type === 'tree') {
        const built = buildTreeContent(text, format);
        if (built.error) {
          setOid(null);
          setHeader(null);
          setEntries([]);
          setError(built.error);
          return;
        }
        setComputing(true);
        try {
          const result = await hashTree(text, format);
          if (cancelled) {
            return;
          }
          setOid(result.oid);
          setHeader(result.header);
          setTotalLength(result.totalLength);
          setEntries(result.entries);
          setError(null);
        } finally {
          if (!cancelled) {
            setComputing(false);
          }
        }
        return;
      }

      if (text === '') {
        setOid(null);
        setHeader(null);
        setEntries([]);
        setError(null);
        return;
      }

      setComputing(true);
      try {
        const result =
          type === 'blob'
            ? await hashBlob(text, format)
            : await hashTextObject(type, text, format);
        if (cancelled) {
          return;
        }
        setOid(result.oid);
        setHeader(result.header);
        setTotalLength(result.totalLength);
        setEntries([]);
        setError(result.error);
      } finally {
        if (!cancelled) {
          setComputing(false);
        }
      }
    }

    recompute();
    return () => {
      cancelled = true;
    };
  }, [type, format, text]);

  /**
   * 切换对象类型时载入对应示例（不清空用户当前选择的格式）
   *
   * @param next - 新对象类型
   */
  const handleTypeChange = (next: GitObjectType) => {
    setType(next);
    setText(SAMPLE_INPUTS[next]);
  };

  /**
   * 复制对象 ID
   */
  const handleCopy = async () => {
    if (!oid) {
      return;
    }
    await copyToClipboard(oid);
    message.success('对象 ID 已复制');
  };

  const typeHint = TYPE_OPTIONS.find((item) => item.value === type)?.hint ?? '';

  const placeholderByType: Record<GitObjectType, string> = {
    blob: '输入文件的原始内容（按 UTF-8 编码，不做 CRLF 清洗，等价 git hash-object --stdin）',
    tree: '每行一条：模式 名称 对象哈希（空格或制表符分隔），如 100644 hello.txt ce0136…',
    commit: '粘贴规范化后的完整 commit 文本（tree/author/committer 头 + 空行 + 消息，注意结尾换行）',
    tag: '粘贴 annotated tag 的完整原始文本（object/type/tag/tagger 头 + 空行 + 标签消息）',
  };

  return (
    <div className={styles.container}>
      <Card title="Git 底层对象哈希计算器（git hash-object 等价）">
        <div className={styles.toolbar}>
          <span className={styles.label}>对象类型：</span>
          <Radio.Group
            value={type}
            onChange={(event) => handleTypeChange(event.target.value as GitObjectType)}
            optionType="button"
            buttonStyle="solid"
            options={TYPE_OPTIONS}
          />
        </div>
        <div className={styles.toolbar} style={{ marginTop: 12 }}>
          <span className={styles.label}>哈希格式：</span>
          <Radio.Group
            value={format}
            onChange={(event) => setFormat(event.target.value as HashFormat)}
            optionType="button"
            options={FORMAT_OPTIONS}
          />
        </div>
        <div className={styles.hint} style={{ marginTop: 8 }}>
          {typeHint}
          {type === 'tree' ? `　${TREE_MODE_HINT}` : ''}
        </div>
      </Card>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="原始输入"
          extra={
            <Space>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setText(SAMPLE_INPUTS[type])}
              >
                示例
              </Button>
              <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
                清空
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            className={styles.editor}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholderByType[type]}
            autoSize={{ minRows: 10, maxRows: 22 }}
            spellCheck={false}
          />
        </Card>

        <Card
          className={styles.card}
          title="对象 ID"
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              disabled={!oid}
              onClick={handleCopy}
            >
              复制
            </Button>
          }
        >
          {computing ? (
            <Spin size="small" />
          ) : error ? (
            <Alert type="error" showIcon message={error} />
          ) : oid ? (
            <div>
              <code className={styles.resultCode}>{oid}</code>
              <div className={styles.resultMeta}>
                <Tag color="blue">{type}</Tag>
                <Tag color="geekblue">{format}</Tag>
                <span className={styles.hint}>
                  头 <code>{header}</code>，参与哈希共 {totalLength} 字节
                </span>
              </div>
              {type === 'tree' ? (
                <>
                  <div className={styles.entriesTitle}>
                    规范化后的二进制条目（已按 Git 规则排序）：
                  </div>
                  <Table<TreeEntryInput>
                    size="small"
                    rowKey={(record) => `${record.mode}-${record.name}`}
                    pagination={false}
                    dataSource={entries}
                    columns={[
                      { title: 'mode', dataIndex: 'mode', width: 90 },
                      { title: 'name', dataIndex: 'name' },
                      { title: 'object', dataIndex: 'oid', className: styles.editor },
                    ]}
                  />
                </>
              ) : null}
            </div>
          ) : (
            <div className={styles.hint}>输入内容后即时计算对象哈希。</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GitObjectHash;
