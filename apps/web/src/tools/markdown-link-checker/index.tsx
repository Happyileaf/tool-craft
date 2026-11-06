'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Table, Tag } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  checkMarkdownLinks,
  type LinkIssue,
  type MarkdownLink,
} from './utils/checker';
import {
  CATEGORY_META,
  DEFAULT_MARKDOWN,
  INPUT_ROWS,
  ISSUE_CODE_LABELS,
  LINK_TYPE_LABELS,
  SEVERITY_COLORS,
} from './constants';
import styles from './index.module.css';

/**
 * 根据链接目标推断分类标签
 *
 * @param link - 链接记录
 * @returns 分类 key
 */
function getCategory(link: MarkdownLink): string {
  if (link.type === 'reference' || link.type === 'definition') {
    return 'other';
  }
  if (link.url.startsWith('#')) {
    return 'anchor';
  }
  if (link.url.startsWith('mailto:') || /@/.test(link.url)) {
    return 'mail';
  }
  if (/^https?:\/\//i.test(link.url)) {
    return 'external';
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(link.url)) {
    return 'other';
  }
  return 'relative';
}

/**
 * Markdown 链接检查器：静态分析引用一致性、重复定义与页内锚点有效性，
 * 全部在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 链接体检交互界面
 */
const MarkdownLinkChecker: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [markdown, setMarkdown] = React.useState<string>(defaultInput || DEFAULT_MARKDOWN);
  const result = React.useMemo(() => checkMarkdownLinks(markdown), [markdown]);

  const issueColumns: ColumnsType<LinkIssue> = [
    { title: '行号', dataIndex: 'line', width: 80 },
    {
      title: '级别',
      dataIndex: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={SEVERITY_COLORS[severity]}>
          {severity === 'error' ? '错误' : severity === 'warning' ? '警告' : '提示'}
        </Tag>
      ),
    },
    {
      title: '问题类型',
      dataIndex: 'code',
      width: 130,
      render: (code: string) => ISSUE_CODE_LABELS[code] ?? code,
    },
    { title: '说明', dataIndex: 'message' },
  ];

  const linkColumns: ColumnsType<MarkdownLink> = [
    { title: '行号', dataIndex: 'line', width: 80 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      render: (type: string, record) => (
        <Space size={4}>
          <Tag>{LINK_TYPE_LABELS[type] ?? type}</Tag>
          {record.isImage && <Tag color="purple">图片</Tag>}
        </Space>
      ),
    },
    { title: '文本', dataIndex: 'text', width: 180, ellipsis: true },
    {
      title: '目标 / 标签',
      dataIndex: 'url',
      render: (url: string) => <span className={styles.urlCell}>{url}</span>,
    },
    {
      title: '分类',
      width: 100,
      render: (_, record) => {
        const category = getCategory(record);
        const meta = CATEGORY_META[category]!;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
  ];

  const errorCount = result.issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = result.issues.filter((issue) => issue.severity === 'warning').length;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button size="small" onClick={() => setMarkdown(DEFAULT_MARKDOWN)}>
            载入示例
          </Button>
        </Space>
        <Button icon={<ClearOutlined />} onClick={() => setMarkdown('')}>
          清空
        </Button>
      </div>

      <Input.TextArea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        rows={INPUT_ROWS}
        placeholder="粘贴 Markdown 文档，工具将静态检查引用一致性、重复定义与页内锚点（不发起网络请求）"
        spellCheck={false}
      />

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <Statistic title="链接总数" value={result.links.length} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="外链" value={result.counts.external} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="相对链接" value={result.counts.relative} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="锚点" value={result.counts.anchor} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="邮件" value={result.counts.mail} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="错误 / 警告" value={errorCount} suffix={`/ ${warningCount}`} />
        </div>
      </div>

      <Card title={`问题清单（${result.issues.length}）`}>
        {result.issues.length === 0 ? (
          markdown.trim() === '' ? (
            <Empty description="暂无文档内容" />
          ) : (
            <Alert type="success" showIcon message="未发现引用或锚点问题" />
          )
        ) : (
          <Table<LinkIssue>
            rowKey={(record) => `${record.line}-${record.code}-${record.message}`}
            size="small"
            columns={issueColumns}
            dataSource={result.issues}
            pagination={false}
          />
        )}
      </Card>

      <Card title={`全部链接（${result.links.length}）`}>
        {result.links.length === 0 ? (
          <Empty description="未提取到链接" />
        ) : (
          <Table<MarkdownLink>
            rowKey={(record, index) => `${record.line}-${record.url}-${index}`}
            size="small"
            scroll={{ x: 800 }}
            columns={linkColumns}
            dataSource={result.links}
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )}
      </Card>

      <Card title={`文档标题锚点（${result.headings.length}）`}>
        {result.headings.length === 0 ? (
          <Empty description="文档中没有标题" />
        ) : (
          <Space wrap>
            {result.headings.map((heading) => (
              <Tag key={`${heading.line}-${heading.slug}`} className={styles.mono}>
                #{heading.slug}
              </Tag>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
};

export default MarkdownLinkChecker;
