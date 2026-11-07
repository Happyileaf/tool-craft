'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  buildDocument,
  parseFrontmatter,
  splitFrontmatter,
  stringifyToml,
  stringifyYaml,
  type FrontmatterFormat,
  type FmIssue,
  type FmValue,
} from './utils/frontmatter';
import { DEFAULT_INPUT, FORMAT_OPTIONS, TYPE_TAG_COLOR, VALUE_TYPE_LABEL } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const valueType = (value: FmValue): string => {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

const formatPreview = (value: FmValue): string => {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 0);
  }
  return String(value);
};

const renderIssues = (issues: FmIssue[]) => {
  if (issues.length === 0) {
    return <Alert type="success" showIcon message="解析通过，未发现格式问题" />;
  }
  return (
    <div className={styles.issues}>
      {issues.map((issue, index) => (
        <Alert
          key={`${issue.line}-${index}`}
          type={issue.level === 'error' ? 'error' : 'warning'}
          showIcon
          message={issue.line > 0 ? `第 ${issue.line} 行 · ${issue.message}` : issue.message}
        />
      ))}
    </div>
  );
};

const MarkdownFrontmatterEditor: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [format, setFormat] = React.useState<FrontmatterFormat>('yaml');
  const [body, setBody] = React.useState('');
  const [entries, setEntries] = React.useState<Array<{ key: string; value: FmValue }>>([]);
  const [issues, setIssues] = React.useState<FmIssue[]>([]);
  const [hasFrontmatter, setHasFrontmatter] = React.useState(false);
  const [newKey, setNewKey] = React.useState('');
  const [newValue, setNewValue] = React.useState('');

  // 解析输入：识别围栏 → 按识别格式解析；无围栏时按当前选择格式提示
  React.useEffect(() => {
    const split = splitFrontmatter(input);
    if (split.format === null) {
      setHasFrontmatter(false);
      setIssues([]);
      setEntries([]);
      setBody(split.body);
      return;
    }
    setHasFrontmatter(true);
    setFormat(split.format);
    setBody(split.body);
    if (split.endLine === 0) {
      setIssues([
        {
          line: 0,
          level: 'error',
          message: '检测到开头围栏但缺少闭合围栏，无法确定元数据边界',
        },
      ]);
      setEntries([]);
      return;
    }
    const parsed = parseFrontmatter(split.format, split.raw);
    setIssues(parsed.issues);
    setEntries(Object.entries(parsed.data).map(([key, value]) => ({ key, value })));
  }, [input]);

  const dataObject = React.useMemo(() => {
    const obj: Record<string, FmValue> = {};
    for (const entry of entries) {
      if (entry.key.trim() !== '') {
        obj[entry.key] = entry.value;
      }
    }
    return obj;
  }, [entries]);

  const frontmatterText = React.useMemo(
    () => (format === 'yaml' ? stringifyYaml(dataObject) : stringifyToml(dataObject)),
    [dataObject, format],
  );

  const rebuilt = React.useMemo(
    () =>
      hasFrontmatter
        ? buildDocument(format, frontmatterText, body)
        : buildDocument(format, frontmatterText, input),
    [hasFrontmatter, format, frontmatterText, body, input],
  );

  const updateValue = (index: number, raw: string) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, value: raw as FmValue } : entry)),
    );
  };

  const updateKey = (index: number, raw: string) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, key: raw } : entry)));
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    const key = newKey.trim();
    if (key === '') {
      message.error('字段名不能为空');
      return;
    }
    if (entries.some((entry) => entry.key === key)) {
      message.error(`字段「${key}」已存在`);
      return;
    }
    setEntries((prev) => [...prev, { key, value: newValue as FmValue }]);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          {
            key: 'edit',
            label: '解析与键值编辑',
            children: (
              <div className={styles.panels}>
                <Card
                  className={styles.card}
                  title="Markdown 原文"
                  extra={
                    <Button size="small" onClick={() => setInput(DEFAULT_INPUT)}>
                      载入样例
                    </Button>
                  }
                >
                  <Input.TextArea
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInput(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 16, maxRows: 28 }}
                  />
                  <div style={{ marginTop: 12 }}>
                    {hasFrontmatter ? (
                      <Alert
                        type="info"
                        showIcon
                        message={`识别到 ${format.toUpperCase()} frontmatter（${
                          FORMAT_OPTIONS.find((option) => option.value === format)?.fence
                        } 围栏），正文与元数据已分离`}
                      />
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="未检测到文档开头的 --- / +++ 围栏，下方可新建元数据后通过输出 Tab 组装文档"
                      />
                    )}
                  </div>
                </Card>

                <Card
                  className={styles.card}
                  title="Frontmatter 结构化字段"
                  extra={
                    <Radio.Group
                      size="small"
                      optionType="button"
                      buttonStyle="solid"
                      value={format}
                      options={FORMAT_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      onChange={(e) => setFormat(e.target.value as FrontmatterFormat)}
                    />
                  }
                >
                  <div className={styles.summary}>
                    <span className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>字段数</span>
                      <strong>{entries.length}</strong>
                    </span>
                    <span className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>问题</span>
                      <strong>{issues.length}</strong>
                    </span>
                  </div>
                  <Table
                    size="small"
                    pagination={false}
                    rowKey={(_, index) => String(index)}
                    dataSource={entries}
                    columns={[
                      {
                        title: '键',
                        dataIndex: 'key',
                        width: 160,
                        render: (value: string, _row, index) => (
                          <Input
                            size="small"
                            value={value}
                            onChange={(e) => updateKey(index, e.target.value)}
                            className={styles.editor}
                          />
                        ),
                      },
                      {
                        title: '类型',
                        dataIndex: 'value',
                        width: 88,
                        render: (value: FmValue) => {
                          const type = valueType(value);
                          return (
                            <Tag color={TYPE_TAG_COLOR[type] ?? 'default'}>
                              {VALUE_TYPE_LABEL[type] ?? type}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: '值',
                        dataIndex: 'value',
                        render: (value: FmValue, _row, index) =>
                          typeof value === 'object' ? (
                            <Input.TextArea
                              size="small"
                              value={formatPreview(value)}
                              readOnly
                              className={styles.editor}
                              autoSize={{ minRows: 1, maxRows: 4 }}
                            />
                          ) : (
                            <Input
                              size="small"
                              value={String(value ?? '')}
                              onChange={(e) => updateValue(index, e.target.value)}
                              className={styles.editor}
                            />
                          ),
                      },
                      {
                        title: '',
                        width: 44,
                        render: (_v, _row, index) => (
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeEntry(index)}
                          />
                        ),
                      },
                    ]}
                  />
                  <div className={styles.shiftRow}>
                    <Input
                      size="small"
                      placeholder="新字段名"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      style={{ width: 160 }}
                      className={styles.editor}
                    />
                    <Input
                      size="small"
                      placeholder="字符串值（对象 / 数组请在原文中编写）"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className={styles.editor}
                    />
                    <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addEntry}>
                      添加字段
                    </Button>
                  </div>
                  {renderIssues(issues)}
                </Card>
              </div>
            ),
          },
          {
            key: 'output',
            label: '正文编辑与输出',
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="正文（原样保留，不参与解析）">
                  <Input.TextArea
                    value={hasFrontmatter ? body : input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const next = e.target.value;
                      if (hasFrontmatter) {
                        setBody(next);
                      } else {
                        setInput(next);
                      }
                    }}
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 18, maxRows: 30 }}
                  />
                </Card>
                <Card
                  className={styles.card}
                  title={`重组输出（${format.toUpperCase()}）`}
                  extra={
                    <Space size={8}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          copyToClipboard(rebuilt);
                          message.success('已复制完整 Markdown 文档');
                        }}
                      >
                        复制
                      </Button>
                    </Space>
                  }
                >
                  <Input.TextArea
                    value={rebuilt}
                    readOnly
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 18, maxRows: 30 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default MarkdownFrontmatterEditor;
