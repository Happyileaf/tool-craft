'use client';

import React from 'react';
import { Alert, Button, Card, Input, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  parseM3u,
  relativeToAbsolute,
  stringifyM3u,
  type M3uIssue,
} from './utils/m3u';
import { DEFAULT_BASE_URL, DEFAULT_M3U_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const renderIssues = (issues: M3uIssue[]) => {
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
          message={`第 ${issue.line} 行 · ${issue.message}`}
        />
      ))}
    </div>
  );
};

const M3uPlaylistCodec: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState(DEFAULT_M3U_INPUT);
  const [baseUrl, setBaseUrl] = React.useState(DEFAULT_BASE_URL);

  const parsed = React.useMemo(() => parseM3u(input), [input]);
  const rebuilt = React.useMemo(() => stringifyM3u(parsed), [parsed]);
  const absolutized = React.useMemo(
    () => relativeToAbsolute(baseUrl, input),
    [baseUrl, input],
  );

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          {
            key: 'parse',
            label: '解析与校验',
            children: (
              <>
                <div className={styles.panels}>
                  <Card
                    className={styles.card}
                    title="M3U / M3U8 原文"
                    extra={
                      <Button size="small" onClick={() => setInput(DEFAULT_M3U_INPUT)}>
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
                    <div className={styles.summary}>
                      <span className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>文件头</span>
                        {parsed.headerPresent ? (
                          <Tag color="green">#EXTM3U</Tag>
                        ) : (
                          <Tag color="orange">缺失</Tag>
                        )}
                      </span>
                      <span className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>条目数</span>
                        <strong>{parsed.entries.length}</strong>
                      </span>
                      <span className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>独立指令</span>
                        <strong>{parsed.standaloneDirectives.length}</strong>
                      </span>
                      <span className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>问题</span>
                        <strong>{parsed.issues.length}</strong>
                      </span>
                    </div>
                    <Table
                      size="small"
                      pagination={parsed.entries.length > 8 ? { pageSize: 8 } : false}
                      rowKey={(_, index) => String(index)}
                      dataSource={parsed.entries}
                      columns={[
                        {
                          title: '时长(s)',
                          dataIndex: 'duration',
                          width: 90,
                          render: (value: number | null) =>
                            value === null ? '—' : value === -1 ? '直播' : value,
                        },
                        { title: '标题', dataIndex: 'title', width: 140 },
                        {
                          title: 'URI / 属性',
                          render: (_, record) => (
                            <div>
                              <div className={styles.uriCell}>{record.uri}</div>
                              {Object.keys(record.attrs).length > 0 ? (
                                <div style={{ marginTop: 4 }}>
                                  {Object.entries(record.attrs).map(([key, value]) => (
                                    <Tag key={key}>
                                      {key}={value}
                                    </Tag>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ),
                        },
                      ]}
                    />
                    <div style={{ marginTop: 12 }}>{renderIssues(parsed.issues)}</div>
                  </Card>
                </div>
              </>
            ),
          },
          {
            key: 'rebuild',
            label: '序列化与相对转绝对',
            children: (
              <div className={styles.panels}>
                <Card
                  className={styles.card}
                  title="往返序列化（parse → stringify）"
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        copyToClipboard(rebuilt);
                        message.success('已复制序列化结果');
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
                <Card
                  className={styles.card}
                  title="相对 URI 转绝对"
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        copyToClipboard(absolutized);
                        message.success('已复制绝对 URI 结果');
                      }}
                    >
                      复制
                    </Button>
                  }
                >
                  <Input
                    className={styles.baseInput}
                    value={baseUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBaseUrl(e.target.value)
                    }
                    addonBefore="Base URL"
                    spellCheck={false}
                  />
                  <Input.TextArea
                    value={absolutized}
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

export default M3uPlaylistCodec;
