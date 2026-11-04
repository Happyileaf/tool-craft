'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Segmented, Space, Table, Tag, Tooltip, message } from 'antd';
import {
  parseLog,
  summarize,
  type CountItem,
  type LineResult,
  type LogSummary,
} from './utils/accessLog';
import { SAMPLE_LOG, STATUS_CLASS_COLORS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue} style={color ? { color } : undefined}>
        {value}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function BarList({ items, total, color }: { items: CountItem[]; total: number; color: string }) {
  return (
    <div>
      {items.map((item) => (
        <div key={item.key} className={styles.barRow}>
          <span className={styles.barLabel}>{item.key}</span>
          <span className={styles.barTrack}>
            <span
              className={styles.barFill}
              style={{ width: `${total > 0 ? Math.max(2, (item.count / total) * 100) : 0}%`, background: color }}
            />
          </span>
          <span className={styles.barCount}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function TopList({ title, items }: { title: string; items: CountItem[] }) {
  const max = items[0]?.count ?? 0;
  return (
    <div>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      <ul className={styles.topList}>
        {items.length === 0 ? (
          <li className={styles.topItem}>
            <span className={styles.topKey} style={{ color: 'rgba(0,0,0,0.35)' }}>
              无数据
            </span>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.key} className={styles.topItem}>
              <Tooltip title={item.key}>
                <span className={`${styles.topKey} ${styles.mono}`}>{item.key}</span>
              </Tooltip>
              <span>
                {item.count}
                <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 11 }}>
                  {' '}
                  ({max > 0 ? Math.round((item.count / max) * 100) : 0}%)
                </span>
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

const AccessLogParser: React.FC<ToolComponentProps> = () => {
  const [text, setText] = React.useState(SAMPLE_LOG);
  const [view, setView] = React.useState<'all' | 'errors'>('all');

  const results = React.useMemo<LineResult[]>(() => parseLog(text), [text]);
  const blankCount = React.useMemo(
    () => text.split(/\r?\n/).filter((line) => line.trim() === '').length,
    [text],
  );
  const summary = React.useMemo<LogSummary>(() => summarize(results, blankCount), [results, blankCount]);
  const entries = React.useMemo(() => results.filter((r) => r.ok) as Extract<LineResult, { ok: true }>[], [results]);
  const errors = React.useMemo(
    () => results.filter((r) => !r.ok) as Extract<LineResult, { ok: false }>[],
    [results],
  );

  const copyJson = () => {
    copyToClipboard(JSON.stringify(entries.map((r) => r.entry), null, 2));
    message.success('已复制解析结果 JSON');
  };

  return (
    <div className={styles.container}>
      <Card
        title="NCSA Common / Combined 访问日志"
        extra={
          <Space>
            <Button size="small" onClick={() => setText(SAMPLE_LOG)}>
              载入示例
            </Button>
            <Button size="small" onClick={() => setText('')}>
              清空
            </Button>
            <Button size="small" type="primary" onClick={copyJson} disabled={entries.length === 0}>
              复制 JSON
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          支持 Common Log Format 与 Combined（含 Referer / User-Agent），以及末尾可选的 request_time
          数值；空字节字段 <code>-</code> 识别为 null，CLF 时间自动转 ISO 8601。所有解析均在浏览器本地完成。
        </p>
        <Input.TextArea
          className={styles.mono}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoSize={{ minRows: 8, maxRows: 20 }}
          spellCheck={false}
          placeholder='粘贴日志，如：127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /a HTTP/1.0" 200 2326 "http://r/" "UA/1.0"'
        />
      </Card>

      <Card title="统计汇总">
        <div className={styles.statGrid}>
          <StatCard label="总行数（含空行）" value={summary.totalLines} />
          <StatCard label="成功解析" value={summary.parsed} color="#52c41a" />
          <StatCard label="解析失败" value={summary.failed} color={summary.failed > 0 ? '#f5222d' : undefined} />
          <StatCard label="成功率" value={`${(summary.successRate * 100).toFixed(1)}%`} />
          <StatCard label="流量合计" value={formatBytes(summary.totalBytes)} />
          <StatCard label="空字节行 (-)" value={summary.nullBytes} />
          <StatCard
            label="时间跨度 / QPS"
            value={
              summary.startMs === null
                ? '—'
                : `${((summary.endMs! - summary.startMs) / 1000).toFixed(0)} s · ${summary.qps.toFixed(2)}`
            }
          />
          <StatCard
            label="平均响应耗时"
            value={summary.avgRequestTimeMs === null ? '—' : `${summary.avgRequestTimeMs.toFixed(1)} ms`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
          <div>
            <strong style={{ fontSize: 13 }}>状态码分布</strong>
            <div style={{ marginTop: 8 }}>
              {summary.parsed === 0 ? (
                <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 13 }}>无数据</span>
              ) : (
                (['2xx', '3xx', '4xx', '5xx', '1xx'] as const)
                  .filter((cls) => summary.statusClasses[cls] > 0)
                  .map((cls) => (
                    <div key={cls} className={styles.barRow}>
                      <span className={styles.barLabel}>{cls}</span>
                      <span className={styles.barTrack}>
                        <span
                          className={styles.barFill}
                          style={{
                            width: `${(summary.statusClasses[cls] / summary.parsed) * 100}%`,
                            background: STATUS_CLASS_COLORS[cls],
                          }}
                        />
                      </span>
                      <span className={styles.barCount}>{summary.statusClasses[cls]}</span>
                    </div>
                  ))
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <BarList items={summary.statusCounts} total={summary.parsed} color="#1677ff" />
            </div>
          </div>
          <div className={styles.topGrid} style={{ gridTemplateColumns: '1fr' }}>
            <TopList title="Top IP" items={summary.topIps} />
            <TopList title="Top 路径" items={summary.topPaths} />
            <TopList title="Top User-Agent" items={summary.topUserAgents} />
          </div>
        </div>

        {summary.startIso && (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message={
              <span className={styles.mono}>
                {summary.startIso} → {summary.endIso}（UTC）
              </span>
            }
          />
        )}
      </Card>

      <Card
        title="逐行解析结果"
        extra={
          <Segmented
            size="small"
            value={view}
            onChange={(value) => setView(value as 'all' | 'errors')}
            options={[
              { label: `全部 (${results.length})`, value: 'all' },
              { label: `仅错误 (${errors.length})`, value: 'errors' },
            ]}
          />
        }
      >
        {view === 'errors' && (
          <Table
            size="small"
            pagination={{ pageSize: 10 }}
            rowKey={(row) => String(row.lineNumber)}
            dataSource={errors}
            columns={[
              { title: '行号', dataIndex: 'lineNumber', width: 80 },
              {
                title: '原始行',
                dataIndex: 'raw',
                render: (raw: string) => (
                  <Tooltip title={raw}>
                    <span className={styles.mono}>{raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}</span>
                  </Tooltip>
                ),
              },
              {
                title: '错误原因',
                dataIndex: 'error',
                width: 240,
                render: (msg: string) => <Tag color="red">{msg}</Tag>,
              },
            ]}
          />
        )}
        {view === 'all' && (
          <Table
            size="small"
            pagination={{ pageSize: 10 }}
            rowKey={(row) => String(row.lineNumber)}
            dataSource={results}
            columns={[
              { title: '行号', dataIndex: 'lineNumber', width: 70 },
              {
                title: '结果',
                width: 80,
                render: (_, row) =>
                  row.ok ? <Tag color="green">成功</Tag> : <Tag color="red">错误</Tag>,
              },
              {
                title: '时间（ISO）',
                width: 200,
                render: (_, row) =>
                  row.ok ? <span className={styles.mono}>{row.entry.timeIso}</span> : null,
              },
              {
                title: 'IP',
                dataIndex: ['entry', 'host'],
                width: 130,
                render: (v: unknown, row) => (row.ok ? <span className={styles.mono}>{v as string}</span> : null),
              },
              {
                title: '请求',
                render: (_, row) =>
                  row.ok ? (
                    <Space size={4}>
                      <Tag color="blue">{row.entry.method ?? '—'}</Tag>
                      <span className={styles.mono}>{row.entry.path ?? '—'}</span>
                    </Space>
                  ) : (
                    <Tag color="red">{row.error}</Tag>
                  ),
              },
              {
                title: '状态',
                width: 80,
                render: (_, row) =>
                  row.ok ? (
                    <Tag color={STATUS_CLASS_COLORS[`${Math.floor(row.entry.status / 100)}xx` as keyof typeof STATUS_CLASS_COLORS]}>
                      {row.entry.status}
                    </Tag>
                  ) : null,
              },
              {
                title: '字节',
                width: 90,
                render: (_, row) => (
                  <span className={styles.mono}>{row.ok ? (row.entry.bytes ?? '-') : null}</span>
                ),
              },
              {
                title: '耗时',
                width: 90,
                render: (_, row) =>
                  row.ok && row.entry.requestTime !== null ? (
                    <span className={styles.mono}>{(row.entry.requestTime * 1000).toFixed(0)} ms</span>
                  ) : null,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default AccessLogParser;
