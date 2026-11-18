'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Form, InputNumber, Radio, Space, Table, Tabs, Tag } from 'antd';
import {
  blockingProbability,
  requiredLines,
  offeredLoad,
  sensitivityTable,
  GOS_PRESETS,
  DEFAULT_LINES,
  DEFAULT_OFFERED,
  DEFAULT_GOS,
} from './utils/erlangB';
import { MAX_TABLE_LINES, MODE_OPTIONS } from './constants';
import styles from './index.module.css';

type Mode = 'blocking' | 'lines' | 'load';

/** 将概率格式化为百分比文本 */
function formatPercent(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${(value * 100).toFixed(3)}%`;
}

/**
 * Erlang B 中继线话务量计算器：基于 M/M/c/c 阻塞清除模型，
 * 提供阻塞概率正算、所需线数反算、可承载话务量反算与灵敏度对照表。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const ErlangBCalculator: React.FC<ToolComponentProps> = (_props) => {
  const [mode, setMode] = React.useState<Mode>('blocking');
  const [lines, setLines] = React.useState<number | null>(DEFAULT_LINES);
  const [offered, setOffered] = React.useState<number | null>(DEFAULT_OFFERED);
  const [gos, setGos] = React.useState<number | null>(DEFAULT_GOS);
  const [tableLines, setTableLines] = React.useState<number | null>(MAX_TABLE_LINES);

  const blockingResult = React.useMemo(
    () => (lines === null || offered === null ? null : blockingProbability(lines, offered)),
    [lines, offered],
  );
  const linesResult = React.useMemo(
    () => (offered === null || gos === null ? null : requiredLines(offered, gos)),
    [offered, gos],
  );
  const loadResult = React.useMemo(
    () => (lines === null || gos === null ? null : offeredLoad(lines, gos)),
    [lines, gos],
  );
  const result =
    mode === 'blocking' ? blockingResult : mode === 'lines' ? linesResult : loadResult;

  const table = React.useMemo(() => {
    if (offered === null || tableLines === null) {
      return null;
    }
    return sensitivityTable(offered, tableLines);
  }, [offered, tableLines]);

  const tableColumns = [
    { title: '中继线数 c', dataIndex: 'lines', width: 120 },
    {
      title: '阻塞概率 B(c,A)',
      dataIndex: 'blocking',
      render: (value: number) => <span className={styles.mono}>{formatPercent(value)}</span>,
    },
    {
      title: '相对 GoS 1%',
      dataIndex: 'blocking',
      render: (value: number) => (
        <Tag color={value <= 0.01 ? 'green' : value <= 0.05 ? 'orange' : 'red'}>
          {value <= 0.01 ? '达标' : value <= 0.05 ? '临界' : '不达标'}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地计算，依据 Erlang B（M/M/c/c 阻塞清除）模型，话务数据不会上传</Tag>

          <Tabs
            items={[
              {
                key: 'calc',
                label: '计算器',
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      value={mode}
                      onChange={(event) => setMode(event.target.value)}
                      options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                    />

                    <Space size="large" wrap style={{ display: 'flex' }}>
                      {(mode === 'blocking' || mode === 'load') && (
                        <Form.Item label="中继线数 c（正整数）" style={{ minWidth: 220, marginBottom: 0 }}>
                          <InputNumber
                            value={lines}
                            onChange={(value) => setLines(value)}
                            min={1}
                            max={100000}
                            precision={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      )}
                      {(mode === 'blocking' || mode === 'lines') && (
                        <Form.Item label="流入话务量 A（Erlang）" style={{ minWidth: 220, marginBottom: 0 }}>
                          <InputNumber
                            value={offered}
                            onChange={(value) => setOffered(value)}
                            min={0}
                            step={0.5}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      )}
                      {(mode === 'lines' || mode === 'load') && (
                        <Form.Item label="目标阻塞概率 GoS（0–1）" style={{ minWidth: 240, marginBottom: 0 }}>
                          <InputNumber
                            value={gos}
                            onChange={(value) => setGos(value)}
                            min={0.0001}
                            max={0.9999}
                            step={0.01}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      )}
                    </Space>

                    {(mode === 'lines' || mode === 'load') && (
                      <Space wrap>
                        {GOS_PRESETS.map((preset) => (
                          <Button key={preset.value} size="small" onClick={() => setGos(preset.value)}>
                            {preset.label}
                          </Button>
                        ))}
                      </Space>
                    )}

                    {result?.errors.map((error) => (
                      <Alert key={error} type="error" showIcon message={error} />
                    ))}
                    {result?.warnings.map((warning) => (
                      <Alert key={warning} type="warning" showIcon message={warning} />
                    ))}

                    {blockingResult && blockingResult.errors.length === 0 && mode === 'blocking' && (
                      <div className={styles.resultGrid}>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>阻塞概率 B(c,A)</span>
                          <span className={styles.resultValue}>{formatPercent(blockingResult.blocking)}</span>
                        </div>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>服务等级判定</span>
                          <span className={styles.resultValue}>
                            {(blockingResult.blocking ?? 1) <= 0.01 ? '优（≤1%）' : (blockingResult.blocking ?? 1) <= 0.05 ? '可接受（≤5%）' : '拥塞'}
                          </span>
                        </div>
                      </div>
                    )}
                    {linesResult && linesResult.errors.length === 0 && mode === 'lines' && (
                      <div className={styles.resultGrid}>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>所需最少中继线数</span>
                          <span className={styles.resultValue}>{linesResult.lines ?? '—'}</span>
                        </div>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>该线数下实际阻塞概率</span>
                          <span className={styles.resultValue}>{formatPercent(linesResult.blocking)}</span>
                        </div>
                      </div>
                    )}
                    {loadResult && loadResult.errors.length === 0 && mode === 'load' && (
                      <div className={styles.resultGrid}>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>最大可承载话务量</span>
                          <span className={styles.resultValue}>
                            {loadResult.offered === null ? '—' : `${loadResult.offered.toFixed(3)} Erlang`}
                          </span>
                        </div>
                        <div className={styles.resultCell}>
                          <span className={styles.resultLabel}>对应阻塞概率</span>
                          <span className={styles.resultValue}>{formatPercent(loadResult.blocking)}</span>
                        </div>
                      </div>
                    )}
                  </Space>
                ),
              },
              {
                key: 'table',
                label: '灵敏度对照表',
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space size="large" wrap style={{ display: 'flex' }}>
                      <Form.Item label="话务量 A（Erlang）" style={{ minWidth: 220, marginBottom: 0 }}>
                        <InputNumber
                          value={offered}
                          onChange={(value) => setOffered(value)}
                          min={0}
                          step={0.5}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <Form.Item label={`对照表最大线数（1–${MAX_TABLE_LINES}）`} style={{ minWidth: 220, marginBottom: 0 }}>
                        <InputNumber
                          value={tableLines}
                          onChange={(value) => setTableLines(value)}
                          min={1}
                          max={MAX_TABLE_LINES}
                          precision={0}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Space>
                    {table?.errors.map((error) => (
                      <Alert key={error} type="error" showIcon message={error} />
                    ))}
                    {table && table.errors.length === 0 && (
                      <Table
                        size="small"
                        rowKey={(record) => String(record.lines)}
                        columns={tableColumns}
                        dataSource={table.rows}
                        pagination={false}
                        scroll={{ y: 420 }}
                      />
                    )}
                  </Space>
                ),
              },
            ]}
          />

          <p className={styles.hint}>
            Erlang B 假设：呼叫到达服从泊松过程、占用时长指数分布、c 条中继线全忙时新呼叫立即清除（不排队）。
            1 Erlang 等于一条中继线被完全占用一小时的话务量。数值计算采用稳定递推式
            {' '}B<sub>n</sub> = A·B<sub>n-1</sub> / (n + A·B<sub>n-1</sub>)，避免大线数下阶乘溢出。
          </p>
        </Space>
      </Card>
    </div>
  );
};

export default ErlangBCalculator;
