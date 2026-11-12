'use client';

import React from 'react';
import { Alert, Card, InputNumber, Radio, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_PARAMS, JITTER_OPTIONS, MAX_RETRIES_LIMIT } from './constants';
import {
  formatMs,
  planRetries,
  validateParams,
  type JitterMode,
  type RetryRow,
} from './utils/backoff';
import styles from './index.module.css';

/**
 * 指数退避与抖动重试策略计算器：
 * 输入 base / multiplier / cap / 重试次数与抖动模式，推演逐次延迟、
 * 延迟区间、期望值与累计耗时，全部在浏览器本地计算。
 *
 * @returns 退避策略推演界面
 */
const BackoffRetryCalculator: React.FC<ToolComponentProps> = () => {
  const [baseMs, setBaseMs] = React.useState<number>(DEFAULT_PARAMS.baseMs);
  const [multiplier, setMultiplier] = React.useState<number>(DEFAULT_PARAMS.multiplier);
  const [capMs, setCapMs] = React.useState<number>(DEFAULT_PARAMS.capMs);
  const [maxRetries, setMaxRetries] = React.useState<number>(DEFAULT_PARAMS.maxRetries);
  const [jitter, setJitter] = React.useState<JitterMode>(DEFAULT_PARAMS.jitter);

  const params = React.useMemo(
    () => ({ baseMs, multiplier, capMs, maxRetries, jitter }),
    [baseMs, multiplier, capMs, maxRetries, jitter],
  );

  const validation = React.useMemo(() => validateParams(params), [params]);

  // 抖动模式含随机性，仅在参数变化时重新推演一次，避免每次渲染跳动
  const rows = React.useMemo(() => {
    if (!validation.valid) {
      return [];
    }
    return planRetries(params);
  }, [baseMs, multiplier, capMs, maxRetries, jitter, validation.valid]);

  const lastRow = rows.at(-1);
  const totalExpected = lastRow ? lastRow.cumulativeExpectedMs : 0;
  const totalActual = lastRow ? lastRow.cumulativeMs : 0;
  const activeHint = JITTER_OPTIONS.find((item) => item.value === jitter)?.hint ?? '';

  const columns: ColumnsType<RetryRow> = [
    { title: '重试序号', dataIndex: 'attempt', key: 'attempt', width: 90 },
    {
      title: '退避上限',
      dataIndex: 'upperBoundMs',
      key: 'upperBoundMs',
      render: (value: number) => <span className={styles.mono}>{formatMs(value)}</span>,
    },
    {
      title: '延迟区间',
      key: 'range',
      render: (_, record) => (
        <span className={styles.mono}>
          {jitter === 'none'
            ? formatMs(record.delayMs)
            : `${formatMs(record.minMs)} ~ ${formatMs(record.maxMs)}`}
        </span>
      ),
    },
    {
      title: '本次实际延迟',
      dataIndex: 'delayMs',
      key: 'delayMs',
      render: (value: number) => <Tag color="blue">{formatMs(value)}</Tag>,
    },
    {
      title: '期望延迟',
      dataIndex: 'expectedMs',
      key: 'expectedMs',
      render: (value: number) => <span className={styles.mono}>{formatMs(value)}</span>,
    },
    {
      title: '累计实际耗时',
      dataIndex: 'cumulativeMs',
      key: 'cumulativeMs',
      render: (value: number) => <span className={styles.mono}>{formatMs(value)}</span>,
    },
    {
      title: '累计期望耗时',
      dataIndex: 'cumulativeExpectedMs',
      key: 'cumulativeExpectedMs',
      render: (value: number) => <span className={styles.mono}>{formatMs(value)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="指数退避与抖动重试策略计算器">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>初始延迟 base（ms）</label>
            <InputNumber
              value={baseMs}
              min={1}
              step={50}
              style={{ width: '100%' }}
              onChange={(value) => setBaseMs(Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>乘数 multiplier</label>
            <InputNumber
              value={multiplier}
              min={1.1}
              step={0.5}
              style={{ width: '100%' }}
              onChange={(value) => setMultiplier(Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>最大延迟 cap（ms）</label>
            <InputNumber
              value={capMs}
              min={1}
              step={100}
              style={{ width: '100%' }}
              onChange={(value) => setCapMs(Number(value))}
            />
          </div>
          <div className={styles.field}>
            <label>重试次数（1-{MAX_RETRIES_LIMIT}）</label>
            <InputNumber
              value={maxRetries}
              min={1}
              max={MAX_RETRIES_LIMIT}
              step={1}
              style={{ width: '100%' }}
              onChange={(value) => setMaxRetries(Number(value))}
            />
          </div>
        </div>

        <div className={styles.field} style={{ marginBottom: 12 }}>
          <label>抖动模式</label>
          <Radio.Group
            value={jitter}
            onChange={(event) => setJitter(event.target.value as JitterMode)}
            optionType="button"
            buttonStyle="solid"
            options={JITTER_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
          <p className={styles.hint} style={{ marginTop: 6 }}>
            {activeHint}
          </p>
        </div>

        {!validation.valid ? (
          <Alert
            type="error"
            showIcon
            message="参数不合法"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : (
          <>
            <Space wrap className={styles.summary}>
              <Statistic title="累计实际耗时" value={formatMs(totalActual)} />
              <Statistic title="累计期望耗时" value={formatMs(totalExpected)} />
              <Tag color="geekblue">共 {rows.length} 次重试</Tag>
            </Space>
            <Table<RetryRow>
              rowKey="attempt"
              columns={columns}
              dataSource={rows}
              pagination={false}
              size="small"
              scroll={{ x: 760 }}
            />
          </>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="策略说明"
        description={
          <div className={styles.hint}>
            <p>
              指数退避让第 n 次重试等待 base × multiplier^(n-1)，并用 cap
              限制单次等待上限，避免故障恢复期间请求持续堆积。
            </p>
            <p>
              纯指数退避会让大量客户端在同一时刻同时重试，形成「惊群」。Full Jitter
              在 [0, 上限] 内均匀随机，打散最彻底；Equal Jitter
              保留一半确定性下限、另一半随机，兼顾延迟下限与并发分散。抖动模式下表格展示延迟区间与统计期望，单次推演结果为随机采样。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default BackoffRetryCalculator;
