'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, message, Radio, Space, Table, Tag } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CopyOutlined } from '@ant-design/icons';
import { parseNegotiationHeader, type HeaderKind, type RankedEntry } from './utils/negotiation';
import { DEFAULT_SAMPLES, HINT, KIND_LABELS, KIND_ORDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 把排序结果组织为纯文本摘要，供复制使用 */
function buildSummary(kind: HeaderKind, result: {
  entries: RankedEntry[];
  preferred: RankedEntry | null;
}): string {
  const lines: string[] = [`${KIND_LABELS[kind]} 内容协商解析结果（RFC 9110 §12.5）`];
  lines.push(
    result.preferred
      ? `首选表示：${result.preferred.token}（q=${result.preferred.q}）`
      : '首选表示：无（无可接受条目）',
  );
  lines.push('排序结果：');
  result.entries.forEach((entry, i) => {
    lines.push(
      `${i + 1}. ${entry.raw}  →  token=${entry.token}；q=${entry.q}；具体度=${entry.specificity}（${entry.note}）；${entry.rejected ? '拒绝' : '接受'}`,
    );
  });
  return lines.join('\n');
}

const ContentNegotiationParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [kind, setKind] = React.useState<HeaderKind>('accept');
  const [headerValue, setHeaderValue] = React.useState(defaultInput || DEFAULT_SAMPLES.accept);

  const result = React.useMemo(() => parseNegotiationHeader(kind, headerValue), [kind, headerValue]);

  const handleKindChange = (next: HeaderKind) => {
    setKind(next);
    setHeaderValue(DEFAULT_SAMPLES[next]);
  };

  const handleCopy = () => {
    if (result.error || result.entries.length === 0) {
      message.error('暂无可复制的解析结果');
      return;
    }
    copyToClipboard(buildSummary(kind, result))
      .then(() => message.success('已复制排序摘要'))
      .catch(() => message.error('复制失败，请检查浏览器权限'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={kind}
          options={KIND_ORDER.map((value) => ({ value, label: KIND_LABELS[value] }))}
          onChange={(e) => handleKindChange(e.target.value as HeaderKind)}
        />
        <Tag color="blue">RFC 9110</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title={`${KIND_LABELS[kind]} 请求头`}>
        <TextArea
          className={styles.editor}
          value={headerValue}
          onChange={(e) => setHeaderValue(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 12 }}
          spellCheck={false}
        />
      </Card>

      {result.error ? (
        <Alert type="error" showIcon message={result.error} />
      ) : (
        <>
          <Card className={styles.card} title="首选表示（服务端优先返回）">
            {result.preferred ? (
              <div className={styles.preferred}>
                <Tag color="green" className={styles.preferredToken}>
                  {result.preferred.token}
                </Tag>
                <span>
                  q 值权重：<strong>{result.preferred.q}</strong>
                </span>
                <span className={styles.hint}>{result.preferred.note}</span>
              </div>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="没有可接受的表示：所有条目 q=0（明确拒绝）或字段为空"
              />
            )}
          </Card>

          <Card
            className={styles.card}
            title={`排序条目（${result.entries.length}）`}
            extra={
              <Space>
                <Button size="small" type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
                  复制摘要
                </Button>
              </Space>
            }
          >
            <Table<RankedEntry>
              className={styles.entries}
              size="small"
              pagination={result.entries.length > 10 ? { pageSize: 10 } : false}
              rowKey={(record) => `${record.raw}-${record.q}`}
              dataSource={result.entries}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 64,
                  render: (_, __, index) => index + 1,
                },
                { title: '原始条目', dataIndex: 'raw', key: 'raw' },
                {
                  title: 'Token',
                  dataIndex: 'token',
                  key: 'token',
                  render: (token: string) => <code>{token}</code>,
                },
                { title: 'q 值', dataIndex: 'q', key: 'q', width: 80 },
                {
                  title: '具体度',
                  key: 'specificity',
                  render: (_, record) => `${record.specificity} · ${record.note}`,
                },
                {
                  title: '状态',
                  dataIndex: 'rejected',
                  key: 'rejected',
                  width: 80,
                  render: (rejected: boolean) =>
                    rejected ? <Tag color="red">拒绝</Tag> : <Tag color="green">接受</Tag>,
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ContentNegotiationParser;
