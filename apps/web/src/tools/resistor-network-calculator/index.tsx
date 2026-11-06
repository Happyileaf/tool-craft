'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Input, InputNumber, Radio, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DEFAULT_TOLERANCE_PERCENT,
  calculateNetwork,
  formatResistance,
  parseResistance,
  type NetworkResult,
  type NetworkTopology,
  type ResistorInput,
} from './utils/resistorNetwork';
import { RESISTOR_TOOL_I18N as T } from './constants';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;

/** 表格中可编辑的电阻行 */
interface ResistorRow {
  key: string;
  raw: string;
  tolerance: number | null;
}

let rowSeq = 0;

function nextKey(): string {
  rowSeq += 1;
  return `resistor-${Date.now()}-${rowSeq}`;
}

function createRow(raw = '', tolerance: number | null = null): ResistorRow {
  return { key: nextKey(), raw, tolerance };
}

/** 首次加载的示例网络（对应验收用例 100Ω±5% 与 200Ω±5%） */
function createSampleRows(): ResistorRow[] {
  return [
    createRow('100', 5),
    createRow('200', 5),
  ];
}

export default function ResistorNetworkCalculator() {
  const [rows, setRows] = useState<ResistorRow[]>(createSampleRows);
  const [topology, setTopology] = useState<NetworkTopology>('series');
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 实时解析每行阻值，记录解析错误用于表格内提示 */
  const parsedRows = useMemo(
    () =>
      rows.map((row) => {
        if (row.raw.trim() === '') {
          return { key: row.key, ohm: null as number | null, parseError: null as string | null };
        }
        try {
          return { key: row.key, ohm: parseResistance(row.raw), parseError: null };
        } catch (caught) {
          return {
            key: row.key,
            ohm: null,
            parseError: caught instanceof Error ? caught.message : String(caught),
          };
        }
      }),
    [rows],
  );

  const parseMap = useMemo(() => {
    const map = new Map<string, { ohm: number | null; parseError: string | null }>();
    for (const item of parsedRows) {
      map.set(item.key, { ohm: item.ohm, parseError: item.parseError });
    }
    return map;
  }, [parsedRows]);

  const handleCalculate = () => {
    try {
      const resistors: ResistorInput[] = rows
        .filter((row) => row.raw.trim() !== '')
        .map((row) => ({
          resistance: parseResistance(row.raw),
          tolerancePercent:
            row.tolerance === null || row.tolerance === undefined
              ? DEFAULT_TOLERANCE_PERCENT
              : Number(row.tolerance),
        }));
      const network = calculateNetwork(resistors, topology);
      setResult(network);
      setError(null);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const handleReset = () => {
    setRows(createSampleRows());
    setTopology('series');
    setResult(null);
    setError(null);
  };

  const updateRow = (key: string, patch: Partial<ResistorRow>) => {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (key: string) => {
    setRows((previous) => previous.filter((row) => row.key !== key));
  };

  const addRow = () => {
    setRows((previous) => [...previous, createRow()]);
  };

  const columns = useMemo(
    () => [
      {
        title: T.colIndex,
        key: 'index',
        width: 60,
        render: (_: unknown, __: ResistorRow, index: number) => index + 1,
      },
      {
        title: T.colResistance,
        dataIndex: 'raw',
        key: 'raw',
        render: (_: unknown, record: ResistorRow) => (
          <div>
            <Input
              placeholder={T.resistancePlaceholder}
              value={record.raw}
              onChange={(event) => updateRow(record.key, { raw: event.target.value })}
            />
            {parseMap.get(record.key)?.parseError ? (
              <div className={styles.parseError}>
                {T.parseError}：{parseMap.get(record.key)?.parseError}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: T.colParsed,
        key: 'parsed',
        width: 130,
        render: (_: unknown, record: ResistorRow) => {
          const parsed = parseMap.get(record.key);
          return parsed?.ohm !== null && parsed?.ohm !== undefined ? (
            <span className={styles.mono}>{formatResistance(parsed.ohm)}</span>
          ) : (
            '—'
          );
        },
      },
      {
        title: T.colTolerance,
        dataIndex: 'tolerance',
        key: 'tolerance',
        width: 140,
        render: (_: unknown, record: ResistorRow) => (
          <InputNumber
            min={0}
            max={100}
            step={1}
            style={{ width: '100%' }}
            placeholder={`默认 ${DEFAULT_TOLERANCE_PERCENT}%`}
            value={record.tolerance}
            onChange={(value) => updateRow(record.key, { tolerance: value })}
          />
        ),
      },
      {
        title: T.colAction,
        key: 'action',
        width: 90,
        render: (_: unknown, record: ResistorRow) => (
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => removeRow(record.key)}
          >
            {T.remove}
          </Button>
        ),
      },
    ],
    [parseMap],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          {T.title}
        </Title>
        <Paragraph className={styles.subtitle}>{T.subtitle}</Paragraph>
      </div>

      <div className={styles.panel}>
        <div className={styles.modeRow}>
          <span className={styles.modeLabel}>{T.topologyLabel}</span>
          <Radio.Group
            value={topology}
            onChange={(event) => setTopology(event.target.value as NetworkTopology)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: T.topologySeries, value: 'series' },
              { label: T.topologyParallel, value: 'parallel' },
            ]}
          />
        </div>

        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={rows}
          columns={columns}
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addRow}>
              {T.addResistor}
            </Button>
          )}
        />

        <Space className={styles.actions}>
          <Button type="primary" onClick={handleCalculate}>
            {T.calculate}
          </Button>
          <Button onClick={handleReset}>{T.reset}</Button>
        </Space>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {T.toleranceHint}。{T.privacyNote}
        </Text>

        {error ? (
          <Alert type="error" showIcon message="无法计算" description={error} />
        ) : null}
      </div>

      {result ? (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.summaryEquivalent}</span>
              <span className={`${styles.summaryValue} ${styles.highlight}`}>
                {formatResistance(result.equivalent)}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.summaryRange}</span>
              <span className={styles.summaryValue}>
                {formatResistance(result.minResistance)}
                <Tag style={{ marginInline: 6 }}>{T.min}</Tag>
                {formatResistance(result.maxResistance)}
                <Tag style={{ marginInline: 6 }}>{T.max}</Tag>
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.summaryWorstCase}</span>
              <span className={styles.summaryValue}>
                ±{result.worstCaseTolerancePercent.toFixed(3)}%
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.summaryRss}</span>
              <span className={styles.summaryValue}>
                ±{result.rssTolerancePercent.toFixed(3)}%
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.summaryE24}</span>
              <span className={styles.summaryValue}>
                {formatResistance(result.e24.value)}
              </span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                偏差 {formatResistance(result.e24.delta)}（{result.e24.deltaPercent.toFixed(2)}%）
              </Text>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
