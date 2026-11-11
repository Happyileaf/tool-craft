'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Descriptions,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CAPACITY_UNIT_OPTIONS, RAID_LEVEL_OPTIONS } from './constants';
import {
  RAID_LEVELS,
  calculateRaid,
  compareAllLevels,
  formatBytes,
  type CapacityUnit,
  type RaidComparisonEntry,
  type RaidLevel,
  type RaidResult,
} from './utils/raid';
import styles from './index.module.css';

/** 对比表行：在对比条目上补充表格行键 */
type ComparisonRow = RaidComparisonEntry & { key: string };

/** 结果区与对比表共用的双口径容量文本 */
function CapacityText({ bytes, unit }: { bytes: number; unit: CapacityUnit }): React.ReactElement {
  const other: CapacityUnit = unit === 'TB' ? 'TiB' : 'TB';
  return (
    <span className={styles.mono}>
      {formatBytes(bytes, unit)}
      <span className={styles.secondary}>（{formatBytes(bytes, other)}）</span>
    </span>
  );
}

/**
 * RAID 磁盘阵列容量与容错规划计算器
 *
 * 选择 RAID 级别、填写盘数与单盘容量后，实时计算原始 / 可用 / 开销容量、
 * 利用率与容错盘数，并以表格对比全部 5 个级别在当前配置下的可行性。
 *
 * @returns RAID 容量计算器交互界面
 */
const RaidCapacityCalculator: React.FC<ToolComponentProps> = () => {
  const [level, setLevel] = React.useState<RaidLevel>('raid5');
  const [diskCount, setDiskCount] = React.useState<number | null>(4);
  const [diskCapacity, setDiskCapacity] = React.useState<number | null>(4);
  const [unit, setUnit] = React.useState<CapacityUnit>('TB');

  /** 单位对应的字节倍率（TB = 10^12，TiB = 2^40） */
  const unitFactor =
    CAPACITY_UNIT_OPTIONS.find((option) => option.value === unit)?.factor ?? 10 ** 12;

  /** 当前级别计算结果（含错误信息），输入不完整时不计算 */
  const outcome = React.useMemo<{ result?: RaidResult; error?: string }>(() => {
    if (diskCount === null || diskCapacity === null) return {};
    try {
      return {
        result: calculateRaid(level, diskCount, diskCapacity * unitFactor),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [level, diskCount, diskCapacity, unitFactor]);

  /** 五级别对比表数据，输入不完整或基础校验失败时给出错误而不渲染数字 */
  const comparison = React.useMemo<{ rows?: ComparisonRow[]; error?: string }>(() => {
    if (diskCount === null || diskCapacity === null) return {};
    try {
      const entries = compareAllLevels(diskCount, diskCapacity * unitFactor);
      return { rows: entries.map((entry) => ({ ...entry, key: entry.level })) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [diskCount, diskCapacity, unitFactor]);

  const selectedOption = RAID_LEVEL_OPTIONS.find((option) => option.value === level);
  const unitHint = CAPACITY_UNIT_OPTIONS.find((option) => option.value === unit)?.hint;

  const columns: ColumnsType<ComparisonRow> = [
    {
      title: 'RAID 级别',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      render: (value: RaidLevel) => RAID_LEVELS[value].label,
    },
    {
      title: '状态',
      dataIndex: 'feasible',
      key: 'feasible',
      width: 100,
      render: (feasible: boolean) =>
        feasible ? <Tag color="green">可行</Tag> : <Tag color="red">不可行</Tag>,
    },
    {
      title: '可用容量',
      key: 'usableBytes',
      render: (_: unknown, row: ComparisonRow) =>
        row.feasible ? <CapacityText bytes={row.usableBytes} unit={unit} /> : '—',
    },
    {
      title: '校验 / 镜像开销',
      key: 'overheadBytes',
      render: (_: unknown, row: ComparisonRow) =>
        row.feasible ? <CapacityText bytes={row.overheadBytes} unit={unit} /> : '—',
    },
    {
      title: '利用率',
      key: 'utilizationPercent',
      width: 100,
      render: (_: unknown, row: ComparisonRow) =>
        row.feasible ? <span className={styles.mono}>{row.utilizationPercent}%</span> : '—',
    },
    {
      title: '容错盘数',
      key: 'faultTolerance',
      width: 100,
      render: (_: unknown, row: ComparisonRow) =>
        row.feasible ? <span className={styles.mono}>{row.faultTolerance} 块</span> : '—',
    },
    {
      title: '不可行原因 / 公式',
      key: 'reason',
      render: (_: unknown, row: ComparisonRow) =>
        row.feasible ? (
          <Tag className={styles.formulaTag}>{RAID_LEVELS[row.level].formula}</Tag>
        ) : (
          <span className={styles.reason}>{row.reason}</span>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="RAID 磁盘阵列容量与容错规划计算器（RAID 0 / 1 / 5 / 6 / 10）">
        <p className={styles.hint}>
          选择 RAID 级别并填写物理盘数与单盘容量，自动计算原始容量、可用容量、校验 / 镜像开销、
          容量利用率与可容忍故障盘数；下方对比表同时列出全部 5 个级别在当前配置下的可行性。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>RAID 级别</div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={level}
              onChange={(event) => setLevel(event.target.value as RaidLevel)}
              options={RAID_LEVEL_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
            />
            {selectedOption ? (
              <div className={styles.optionMeta}>
                <Typography.Text type="secondary">{selectedOption.minDisksText}</Typography.Text>
                <p className={styles.optionDesc}>{selectedOption.description}</p>
                <p className={styles.optionDesc}>
                  典型用途：{selectedOption.useCase}
                </p>
              </div>
            ) : null}
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>阵列参数</div>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <span className={styles.inlineLabel}>物理盘数</span>
                <InputNumber
                  min={1}
                  precision={0}
                  step={1}
                  style={{ width: 160 }}
                  placeholder="如 4"
                  value={diskCount}
                  onChange={(value) => setDiskCount(value === null ? null : Number(value))}
                />
                <span className={styles.unitHint}>块（≥ 1 的整数）</span>
              </div>
              <div>
                <span className={styles.inlineLabel}>单盘容量</span>
                <InputNumber
                  min={0}
                  step={1}
                  style={{ width: 160 }}
                  placeholder="如 4"
                  value={diskCapacity}
                  onChange={(value) => setDiskCapacity(value === null ? null : Number(value))}
                />
                <Select<CapacityUnit>
                  style={{ width: 92, marginLeft: 8 }}
                  value={unit}
                  onChange={(value) => setUnit(value)}
                  options={CAPACITY_UNIT_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                />
              </div>
              <Typography.Text type="secondary" className={styles.unitHint}>
                {unitHint}
              </Typography.Text>
            </Space>
          </div>
        </div>

        {outcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="当前级别无法计算"
            description={outcome.error}
          />
        ) : null}
        {comparison.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="输入不合法"
            description={comparison.error}
          />
        ) : null}

        {outcome.result ? (
          <Descriptions
            style={{ marginTop: 16 }}
            size="small"
            bordered
            column={2}
            title={`${RAID_LEVELS[level].label} 计算结果`}
            items={[
              {
                key: 'raw',
                label: '原始总容量',
                children: <CapacityText bytes={outcome.result.rawBytes} unit={unit} />,
              },
              {
                key: 'usable',
                label: '可用容量',
                children: <CapacityText bytes={outcome.result.usableBytes} unit={unit} />,
              },
              {
                key: 'overhead',
                label: '校验 / 镜像开销',
                children: <CapacityText bytes={outcome.result.overheadBytes} unit={unit} />,
              },
              {
                key: 'utilization',
                label: '容量利用率',
                children: <span className={styles.mono}>{outcome.result.utilizationPercent}%</span>,
              },
              {
                key: 'fault',
                label: '可容忍故障盘数',
                children: (
                  <span className={styles.mono}>{outcome.result.faultTolerance} 块</span>
                ),
              },
              {
                key: 'formula',
                label: '容量公式',
                children: <Tag className={styles.formulaTag}>{RAID_LEVELS[level].formula}</Tag>,
              },
            ]}
          />
        ) : null}

        {comparison.rows ? (
          <div style={{ marginTop: 16 }}>
            <div className={styles.tableTitle}>全部 RAID 级别对比（当前盘数与单盘容量）</div>
            <Table<ComparisonRow>
              size="small"
              pagination={false}
              columns={columns}
              dataSource={comparison.rows}
              rowKey="key"
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default RaidCapacityCalculator;
