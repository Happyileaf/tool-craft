'use client';

import React from 'react';
import { Alert, Button, Card, Input, Segmented, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { parseHttpMessage, toSummaryJson, type ParseIssue } from './utils/httpMessage';
import { DEFAULT_REQUEST, DEFAULT_RESPONSE, SIDE_OPTIONS, type SideOption } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { TextArea } = Input;

const ISSUE_COLOR: Record<ParseIssue['level'], string> = {
  error: 'red',
  warning: 'orange',
};

const HttpMessageParser: React.FC<ToolComponentProps> = () => {
  const [raw, setRaw] = React.useState(DEFAULT_REQUEST);
  const [side, setSide] = React.useState<SideOption>('auto');

  const parsed = React.useMemo(() => {
    if (raw.trim() === '') return { msg: null, error: '' };
    try {
      return { msg: parseHttpMessage(raw), error: '' };
    } catch (e) {
      return { msg: null, error: e instanceof Error ? e.message : '解析失败' };
    }
  }, [raw]);

  const msg = parsed.msg;
  const sideMismatch = msg !== null && side !== 'auto' && side !== msg.kind;

  const loadSample = (next: SideOption) => {
    setSide(next);
    setRaw(next === 'response' ? DEFAULT_RESPONSE : DEFAULT_REQUEST);
  };

  const handleCopySummary = () => {
    if (!msg) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(toSummaryJson(msg));
    message.success('已复制结构化 JSON 摘要');
  };

  const headerColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 56,
      render: (v: number) => v + 1,
    },
    { title: 'Header', dataIndex: 'name', key: 'name', width: 200, className: styles.mono },
    {
      title: 'Value / 展开',
      dataIndex: 'value',
      key: 'value',
      render: (_: unknown, row: { value: string; detail?: string }) => (
        <div className={styles.mono}>
          <div>{row.value}</div>
          {row.detail && <div className={styles.detailCell}>{row.detail}</div>}
        </div>
      ),
    },
  ];

  const queryColumns = [
    { title: 'Key', dataIndex: 'key', key: 'key', className: styles.mono },
    { title: 'Value', dataIndex: 'value', key: 'value', className: styles.mono },
  ];

  return (
    <div className={styles.container}>
      <Card size="small" title="① 原始 HTTP 报文">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div className={styles.controls}>
            <Segmented
              options={SIDE_OPTIONS}
              value={side}
              onChange={(v) => loadSample(v as SideOption)}
            />
          </div>
          <TextArea
            rows={12}
            className={styles.editor}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="粘贴原始 HTTP 请求或响应，支持 CRLF / LF"
          />
        </Space>
      </Card>

      {parsed.error && <Alert type="error" showIcon message={parsed.error} />}
      {sideMismatch && (
        <Alert
          type="warning"
          showIcon
          message={`手动指定为${side === 'request' ? '请求' : '响应'}报文，但自动识别结果为${msg?.kind === 'request' ? '请求' : '响应'}，以下按报文实际结构展示`}
        />
      )}

      {msg && (
        <>
          {msg.issues.length > 0 && (
            <Card size="small" title={`② 异常与告警（${msg.issues.length}）`}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {msg.issues.map((issue, i) => (
                  <Alert
                    key={i}
                    type={issue.level === 'error' ? 'error' : 'warning'}
                    showIcon
                    message={
                      <span>
                        <Tag color={ISSUE_COLOR[issue.level]}>{issue.level === 'error' ? '错误' : '警告'}</Tag>
                        <span className={styles.mono}>[{issue.location}]</span> {issue.message}
                      </span>
                    }
                  />
                ))}
              </Space>
            </Card>
          )}

          <Card size="small" title="③ 起始行与概要">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Tag color={msg.kind === 'request' ? 'blue' : 'green'}>
                {msg.kind === 'request' ? '请求 Request' : '响应 Response'}
              </Tag>
              <div className={styles.startLine}>{msg.startLine}</div>
              <div className={styles.summaryGrid}>
                {msg.kind === 'request' ? (
                  <>
                    <SummaryItem label="Method" value={msg.method ?? '-'} />
                    <SummaryItem label="Path" value={msg.pathname ?? '-'} />
                  </>
                ) : (
                  <>
                    <SummaryItem label="Status" value={String(msg.statusCode ?? '-')} />
                    <SummaryItem label="Reason" value={msg.reasonPhrase || '-'} />
                    <SummaryItem label="含义" value={msg.statusMeaning ?? '未收录状态码'} />
                  </>
                )}
                <SummaryItem label="Version" value={msg.version || '-'} />
                <SummaryItem label="Header 数" value={String(msg.headers.length)} />
                <SummaryItem label="Body 字节" value={String(msg.bodyLength)} />
                <SummaryItem label="Chunked" value={msg.isChunked ? '是' : '否'} />
              </div>
            </Space>
          </Card>

          {msg.kind === 'request' && (msg.queryParams?.length ?? 0) > 0 && (
            <Card size="small" title="④ Query 参数">
              <Table
                rowKey={(row) => `${row.key}-${row.value}`}
                size="small"
                pagination={false}
                columns={queryColumns}
                dataSource={msg.queryParams}
              />
            </Card>
          )}

          <Card size="small" title="⑤ Headers 结构化与展开">
            <Table
              rowKey={(row) => `${row.name}-${row.index}`}
              size="small"
              pagination={false}
              columns={headerColumns}
              dataSource={msg.headers}
            />
          </Card>

          {msg.body && (
            <Card
              size="small"
              title="⑥ Body"
              extra={
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    copyToClipboard(msg.body);
                    message.success('已复制 Body');
                  }}
                >
                  复制
                </Button>
              }
            >
              <pre className={styles.bodyBox}>{msg.body}</pre>
            </Card>
          )}

          <Button block icon={<CopyOutlined />} onClick={handleCopySummary}>
            复制完整结构化 JSON 摘要
          </Button>
        </>
      )}
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className={styles.detailCell}>{label}</div>
    <div className={`${styles.mono}`} style={{ fontWeight: 600 }}>
      {value}
    </div>
  </div>
);

export default HttpMessageParser;
