'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  EPOCH_DEFS,
  convertTimestamp,
  fromUtcDateTime,
  toUtcDateTime,
  nowUnixNs,
  type EpochKey,
} from './utils/epochs';
import { EPOCH_SELECT_OPTIONS, DEFAULT_TIMESTAMP, DEFAULT_SOURCE } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'fromTimestamp' | 'fromDateTime';

interface EpochRow {
  key: EpochKey;
  label: string;
  description: string;
  value: string;
}

function buildRows(values: Partial<Record<EpochKey, string>>): EpochRow[] {
  return EPOCH_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    value: values[def.key] ?? '',
  }));
}

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/;

const MultiEpochTimestamp: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('fromTimestamp');
  const [source, setSource] = React.useState<EpochKey>(DEFAULT_SOURCE);
  const [timestamp, setTimestamp] = React.useState(defaultInput || DEFAULT_TIMESTAMP);
  const [dtText, setDtText] = React.useState('2000-01-01 00:00:00.000');

  const tsResult = React.useMemo(
    () => (mode === 'fromTimestamp' ? convertTimestamp(timestamp, source) : null),
    [mode, timestamp, source],
  );

  const dtResult = React.useMemo(() => {
    if (mode !== 'fromDateTime') return null;
    const match = DATETIME_RE.exec(dtText.trim());
    if (!match) {
      return {
        unixNs: null,
        values: {},
        iso: null,
        error: '日期时间格式无法识别，请使用 2024-06-15 12:30:45.250（可省略毫秒），按 UTC 解释',
      } as const;
    }
    const [, y, mo, d, h, mi, s, ms] = match;
    return fromUtcDateTime({
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: Number(h),
      minute: Number(mi),
      second: Number(s),
      millisecond: ms ? Number(ms.padEnd(3, '0')) : 0,
    });
  }, [mode, dtText]);

  const activeResult = mode === 'fromTimestamp' ? tsResult : dtResult;
  const rows = activeResult && activeResult.unixNs !== null ? buildRows(activeResult.values) : [];
  const utcIso =
    mode === 'fromTimestamp' && tsResult && tsResult.unixNs !== null
      ? toUtcDateTime(tsResult.unixNs).iso
      : dtResult?.iso ?? null;

  const handleCopyAll = () => {
    if (rows.length === 0) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(rows.map((r) => `${r.label}\t${r.value}`).join('\n'));
    message.success('已复制全部纪元值');
  };

  const handleUseNow = () => {
    setSource('unix-ns');
    setTimestamp(nowUnixNs().toString());
    setMode('fromTimestamp');
  };

  const handleFillSample = () => {
    setDtText('2000-01-01 00:00:00.000');
  };

  const columns = [
    { title: '纪元', dataIndex: 'label', key: 'label', width: 200 },
    { title: '说明', dataIndex: 'description', key: 'description', width: 340 },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (v: string, row: EpochRow) => (
        <Space size={8}>
          <code className={styles.mono}>{v}</code>
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => {
              copyToClipboard(v);
              message.success(`已复制 ${row.label}`);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'fromTimestamp', label: '时间戳 → 日期时间' },
            { value: 'fromDateTime', label: '日期时间 → 时间戳' },
          ]}
          onChange={(e) => setMode(e.target.value as Mode)}
        />
        <Tag color="blue">BigInt 纳秒内核</Tag>
        <span className={styles.hint}>统一换算 Unix / FILETIME / .NET Ticks / Chrome / Cocoa，全部按 UTC</span>
      </div>

      <Card className={styles.card} title={mode === 'fromTimestamp' ? '输入时间戳（整数）' : '输入 UTC 日期时间'}>
        {mode === 'fromTimestamp' ? (
          <Space direction="vertical" size={12} className={styles.fullWidth}>
            <Radio.Group
              optionType="button"
              size="small"
              value={source}
              options={EPOCH_SELECT_OPTIONS}
              onChange={(e) => setSource(e.target.value as EpochKey)}
            />
            <Space.Compact className={styles.fullWidth}>
              <Input
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="粘贴整数时间戳…"
              />
              <Button onClick={handleUseNow}>填入当前时刻</Button>
            </Space.Compact>
            <span className={styles.hint}>
              当前按「{EPOCH_SELECT_OPTIONS.find((o) => o.value === source)?.label}」解释输入
            </span>
          </Space>
        ) : (
          <Space direction="vertical" size={12} className={styles.fullWidth}>
            <Space.Compact className={styles.fullWidth}>
              <Input
                value={dtText}
                onChange={(e) => setDtText(e.target.value)}
                spellCheck={false}
                className={styles.editor}
                placeholder="2000-01-01 00:00:00.000（UTC）"
              />
              <Button onClick={handleFillSample}>填入样例</Button>
            </Space.Compact>
            <span className={styles.hint}>
              格式 YYYY-MM-DD HH:mm:ss（可加 .fff 毫秒），按 UTC（零时区）解释
            </span>
          </Space>
        )}
      </Card>

      {activeResult?.error ? <Alert type="error" showIcon message={activeResult.error} /> : null}

      {rows.length > 0 ? (
        <Card
          className={styles.card}
          title="各纪元等价值"
          extra={
            <Space>
              {utcIso ? <Tag color="green">UTC：{utcIso}</Tag> : null}
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyAll}>
                复制全部
              </Button>
            </Space>
          }
        >
          <Table<EpochRow>
            columns={columns}
            dataSource={rows}
            rowKey="key"
            size="small"
            pagination={false}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default MultiEpochTimestamp;
