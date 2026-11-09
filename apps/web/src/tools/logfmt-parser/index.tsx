'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Segmented, Select, Space, Statistic, Table, Tabs, Tag, message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { HINT, SAMPLE_INPUT, TYPE_COLORS, TYPE_LABELS } from './constants';
import {
  parseLogfmt,
  serializeFields,
  type LogfmtField,
  type LogfmtLine,
} from './utils/logfmt';
import styles from './index.module.css';

type Mode = 'parse' | 'serialize';

interface FlatRow extends LogfmtField {
  key: string;
  lineNo: number;
}

/**
 * logfmt 解析与格式化：解析模式按行对齐字段表 / JSON 视图并告警畸形行；
 * 序列化模式把每行 key=value 文本规范化为合规 logfmt。
 *
 * @returns logfmt 工具交互界面
 */
const LogfmtParser: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [input, setInput] = React.useState(SAMPLE_INPUT);
  const [fieldFilter, setFieldFilter] = React.useState<string | undefined>(undefined);

  const parsed = React.useMemo(() => parseLogfmt(input), [input]);

  const flatRows: FlatRow[] = React.useMemo(() => {
    const rows: FlatRow[] = [];
    for (const line of parsed.lines) {
      for (const [index, field] of line.fields.entries()) {
        if (fieldFilter && field.key !== fieldFilter) continue;
        rows.push({ ...field, key: `${line.lineNo}-${index}`, lineNo: line.lineNo });
      }
    }
    return rows;
  }, [parsed, fieldFilter]);

  const jsonView = React.useMemo(
    () =>
      parsed.lines.map((line: LogfmtLine) =>
        Object.fromEntries(line.fields.map((f) => [f.key, f.value])),
      ),
    [parsed],
  );

  const serialized = React.useMemo(() => {
    if (mode !== 'serialize') return '';
    try {
      return parsed.lines
        .map((line) =>
          serializeFields(line.fields.map((f) => ({ key: f.key, value: f.value }))),
        )
        .join('\n');
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, [mode, parsed]);

  const copy = (text: string, label: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const columns = [
    { title: '行号', dataIndex: 'lineNo', key: 'lineNo', width: 72 },
    { title: '键', dataIndex: 'key', key: 'name', render: (text: string) => <span className={styles.mono}>{text}</span> },
    {
      title: '原始值',
      dataIndex: 'rawValue',
      key: 'rawValue',
      render: (text: string) => <span className={styles.mono}>{text === '' ? <Tag>空值</Tag> : text}</span>,
    },
    {
      title: '推断类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type] ?? type}</Tag>,
    },
    {
      title: '转换值',
      dataIndex: 'value',
      key: 'value',
      render: (value: unknown) => <span className={styles.mono}>{String(value)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="logfmt 日志解析与格式化（key=value 双向转换 · 类型推断）"
        extra={
          <Space>
            <Button size="small" onClick={() => setInput(SAMPLE_INPUT)}>
              示例
            </Button>
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Segmented
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            options={[
              { label: '解析 logfmt', value: 'parse' },
              { label: '序列化为 logfmt', value: 'serialize' },
            ]}
          />
          {mode === 'parse' ? (
            <Select
              allowClear
              size="middle"
              style={{ minWidth: 180 }}
              placeholder="按字段名筛选"
              value={fieldFilter}
              onChange={(value) => setFieldFilter(value)}
              options={parsed.fieldNames.map((name) => ({ label: name, value: name }))}
            />
          ) : null}
        </Space>

        <p className={styles.hint}>{HINT}</p>

        <Input.TextArea
          className={styles.editor}
          rows={7}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='粘贴 logfmt 日志，例如：level=info msg="server started" port=8080 debug'
        />

        {mode === 'parse' ? (
          <>
            <Space wrap className={styles.statsRow} style={{ marginTop: 16 }}>
              <Statistic title="有效行数" value={parsed.lines.length} />
              <Statistic title="字段总数" value={parsed.fieldCount} />
              <Statistic title="去重字段" value={parsed.fieldNames.length} />
              <Statistic title="告警数" value={parsed.warnings.length} valueStyle={{ color: parsed.warnings.length ? '#cf1322' : undefined }} />
            </Space>

            {parsed.warnings.map((warning, index) => (
              <Alert
                key={index}
                style={{ marginBottom: 8 }}
                type="warning"
                showIcon
                message={warning}
              />
            ))}

            {flatRows.length === 0 ? (
              <Empty description="输入 logfmt 行后在此展示字段表" />
            ) : (
              <Tabs
                items={[
                  {
                    key: 'table',
                    label: '字段表',
                    children: (
                      <>
                        <Space style={{ marginBottom: 8 }}>
                          <Button size="small" onClick={() => copy(flatRows.map((r) => `${r.key}=${r.rawValue}`).join('\n'), '字段表')}>
                            复制字段表
                          </Button>
                        </Space>
                        <Table size="small" pagination={{ pageSize: 10 }} columns={columns} dataSource={flatRows} />
                      </>
                    ),
                  },
                  {
                    key: 'json',
                    label: 'JSON 视图',
                    children: (
                      <>
                        <Space style={{ marginBottom: 8 }}>
                          <Button size="small" onClick={() => copy(JSON.stringify(jsonView, null, 2), 'JSON')}>
                            复制 JSON
                          </Button>
                        </Space>
                        <Input.TextArea
                          className={styles.editor}
                          rows={12}
                          readOnly
                          value={JSON.stringify(jsonView, null, 2)}
                        />
                      </>
                    ),
                  },
                  {
                    key: 'types',
                    label: '字段类型清单',
                    children: (
                      <Space wrap>
                        {parsed.fieldNames.map((name) => {
                          const sample = parsed.lines
                            .flatMap((line) => line.fields)
                            .find((f) => f.key === name);
                          return (
                            <Tag key={name} color={sample ? TYPE_COLORS[sample.type] : 'default'}>
                              {name}：{sample ? TYPE_LABELS[sample.type] : '—'}
                            </Tag>
                          );
                        })}
                      </Space>
                    ),
                  },
                ]}
              />
            )}
          </>
        ) : (
          <div style={{ marginTop: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <Button size="small" onClick={() => copy(serialized, 'logfmt')}>
                复制结果
              </Button>
            </Space>
            <Input.TextArea className={styles.editor} rows={10} readOnly value={serialized} placeholder="序列化结果" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogfmtParser;
