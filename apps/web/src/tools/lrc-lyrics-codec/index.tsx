'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { formatTimeTag, parseLrc, shiftOffset, stringifyLrc, type LrcIssue } from './utils/lrc';
import { DEFAULT_LRC_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const renderIssues = (issues: LrcIssue[]) => {
  if (issues.length === 0) {
    return <Alert type="success" showIcon message="校验通过，未发现格式问题" />;
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

const LrcLyricsCodec: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState(DEFAULT_LRC_INPUT);
  const [deltaMs, setDeltaMs] = React.useState<number | null>(0);

  const parsed = React.useMemo(() => parseLrc(input), [input]);

  const shifted = React.useMemo(() => {
    if (deltaMs === null || deltaMs === 0) {
      return { result: parsed, clampedCount: 0 };
    }
    return shiftOffset(parsed, deltaMs);
  }, [parsed, deltaMs]);

  const rebuilt = React.useMemo(() => stringifyLrc(shifted.result), [shifted]);

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          {
            key: 'parse',
            label: '解析与校验',
            children: (
              <div className={styles.panels}>
                <Card
                  className={styles.card}
                  title="LRC 原文"
                  extra={
                    <Button size="small" onClick={() => setInput(DEFAULT_LRC_INPUT)}>
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
                    autoSize={{ minRows: 14, maxRows: 26 }}
                  />
                </Card>
                <Card className={styles.card} title="结构化结果">
                  <div className={styles.metaTags}>
                    {Object.entries(parsed.meta).map(([key, value]) => (
                      <Tag key={key} color="blue">
                        {key}: {value}
                      </Tag>
                    ))}
                  </div>
                  <div className={styles.summary}>
                    <span className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>歌词行</span>
                      <strong>{parsed.lines.length}</strong>
                    </span>
                    <span className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>纯文本行</span>
                      <strong>{parsed.plain.length}</strong>
                    </span>
                    <span className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>问题</span>
                      <strong>{parsed.issues.length}</strong>
                    </span>
                  </div>
                  <Table
                    size="small"
                    pagination={parsed.lines.length > 8 ? { pageSize: 8 } : false}
                    rowKey={(_, index) => String(index)}
                    dataSource={parsed.lines}
                    columns={[
                      {
                        title: '时间点',
                        dataIndex: 'time',
                        width: 120,
                        render: (value: number) => (
                          <span className={styles.editor}>{formatTimeTag(value)}</span>
                        ),
                      },
                      { title: '秒数', dataIndex: 'time', width: 90, render: (v: number) => v.toFixed(2) },
                      { title: '歌词', dataIndex: 'text' },
                    ]}
                  />
                  <div style={{ marginTop: 12 }}>{renderIssues(parsed.issues)}</div>
                </Card>
              </div>
            ),
          },
          {
            key: 'shift',
            label: '平移与序列化',
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="整体时间平移">
                  <div className={styles.shiftRow}>
                    <span>平移量（毫秒，支持负数）</span>
                    <InputNumber
                      value={deltaMs}
                      onChange={setDeltaMs}
                      step={100}
                      precision={0}
                      addonAfter="ms"
                      style={{ width: 180 }}
                    />
                    <Button size="small" onClick={() => setDeltaMs(0)}>
                      重置
                    </Button>
                  </div>
                  {shifted.clampedCount > 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={`有 ${shifted.clampedCount} 行负平移后早于 0 秒，已钳位到 [00:00.00]`}
                    />
                  ) : (
                    <Alert type="info" showIcon message="平移结果在右侧实时预览，meta 标签保持不变" />
                  )}
                </Card>
                <Card
                  className={styles.card}
                  title="序列化输出（LF + 两位百分秒）"
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        copyToClipboard(rebuilt);
                        message.success('已复制 LRC 文本');
                      }}
                    >
                      复制
                    </Button>
                  }
                >
                  <Input.TextArea
                    value={rebuilt}
                    readOnly
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 14, maxRows: 26 }}
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

export default LrcLyricsCodec;
