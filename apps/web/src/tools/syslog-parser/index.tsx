'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Table, Tag } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  parseSyslog,
  type ParsedSyslogLine,
  type StructuredDataBlock,
} from './utils/syslog';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_SYSLOG_INPUT,
  FORMAT_LABELS,
  FORMAT_TAG_COLORS,
  INPUT_ROWS,
  MAX_TABLE_ROWS,
  SEVERITY_TAG_COLORS,
} from './constants';
import styles from './index.module.css';

/**
 * 渲染单个结构化数据块（SD-ID 与其参数键值对）
 *
 * @param block - 结构化数据块
 * @param index - 块序号（作为 key）
 * @returns 块展示节点
 */
function renderStructuredBlock(block: StructuredDataBlock, index: number) {
  return (
    <div key={`${block.id}-${index}`} className={styles.sdBlock}>
      <div className={styles.sdId}>{block.id}</div>
      {Object.entries(block.params).map(([key, value]) => (
        <div key={key} className={styles.sdParam}>
          {key} = <code>{value}</code>
        </div>
      ))}
    </div>
  );
}

/**
 * Syslog 日志行解析器：批量解析 RFC 5424 / RFC 3164 日志，
 * 逐行展示 PRI 解码、结构化数据与错误信息；全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Syslog 解析交互界面
 */
const SyslogParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SYSLOG_INPUT);

  const result = React.useMemo(() => parseSyslog(input), [input]);

  const columns: ColumnsType<ParsedSyslogLine> = [
    {
      title: '#',
      dataIndex: 'lineNo',
      width: 56,
    },
    {
      title: '格式',
      dataIndex: 'format',
      width: 110,
      render: (format: string) => (
        <Tag color={FORMAT_TAG_COLORS[format]}>{FORMAT_LABELS[format] ?? format}</Tag>
      ),
    },
    {
      title: '严重级',
      width: 130,
      render: (_, record) =>
        record.fields.severityName ? (
          <Tag color={SEVERITY_TAG_COLORS[record.fields.severityName] ?? 'default'}>
            {record.fields.severityCode} {record.fields.severityName}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '设施',
      width: 140,
      render: (_, record) =>
        record.fields.facilityName
          ? `${record.fields.facilityCode} ${record.fields.facilityName}`
          : '-',
    },
    {
      title: '时间戳',
      dataIndex: ['fields', 'timestamp'],
      width: 210,
      render: (value?: string) => value ?? '-',
    },
    {
      title: '主机 / 应用',
      width: 200,
      render: (_, record) => {
        const app = record.fields.app
          ? record.fields.procid
            ? `${record.fields.app}[${record.fields.procid}]`
            : record.fields.app
          : '-';
        return (
          <div>
            <div>{record.fields.host ?? '-'}</div>
            <div className={styles.sdParam}>{app}</div>
          </div>
        );
      },
    },
    {
      title: '消息正文',
      dataIndex: ['fields', 'message'],
      ellipsis: true,
      render: (value?: string) => value ?? '-',
    },
    {
      title: '错误',
      dataIndex: 'errors',
      width: 100,
      render: (errors: string[]) =>
        errors.length > 0 ? <Tag color="red">{errors.length} 项</Tag> : <Tag color="green">正常</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button size="small" onClick={() => setInput(DEFAULT_SYSLOG_INPUT)}>
            载入示例
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={input.trim() === ''}
            onClick={() => void copyToClipboard(input)}
          >
            复制原文
          </Button>
        </Space>
        <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
          清空
        </Button>
      </div>

      <Input.TextArea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={INPUT_ROWS}
        placeholder="粘贴 syslog 日志，每行一条，支持 RFC 5424、RFC 3164 与无 PRI 纯文本"
        spellCheck={false}
      />

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <Statistic title="有效行数" value={result.summary.total} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="RFC 5424" value={result.summary.formatCounts.rfc5424} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="RFC 3164" value={result.summary.formatCounts.rfc3164} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="未知格式" value={result.summary.formatCounts.unknown} />
        </div>
        <div className={styles.statCard}>
          <Statistic title="含错误行" value={result.summary.errorLines} />
        </div>
      </div>

      {result.lines.length > MAX_TABLE_ROWS && (
        <Alert
          type="warning"
          showIcon
          message={`结果超过 ${MAX_TABLE_ROWS} 行，表格仅渲染前 ${MAX_TABLE_ROWS} 行；解析与统计仍覆盖全部输入。`}
        />
      )}

      <Card title="逐行解析结果">
        {result.lines.length === 0 ? (
          <Empty description="暂无日志内容" />
        ) : (
          <Table<ParsedSyslogLine>
            rowKey="lineNo"
            size="small"
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={result.lines.slice(0, MAX_TABLE_ROWS)}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            expandable={{
              expandedRowRender: (record) => (
                <div>
                  {record.errors.length > 0 && (
                    <Alert
                      type="error"
                      showIcon
                      style={{ marginBottom: 8 }}
                      message="解析错误"
                      description={record.errors.map((message) => (
                        <div key={message} className={styles.errorText}>
                          {message}
                        </div>
                      ))}
                    />
                  )}
                  {record.fields.structuredData && record.fields.structuredData.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {record.fields.structuredData.map((block, index) =>
                        renderStructuredBlock(block, index),
                      )}
                    </div>
                  )}
                  <pre className={styles.rawText}>{record.raw}</pre>
                </div>
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default SyslogParser;
