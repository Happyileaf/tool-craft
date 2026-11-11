'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  DEFAULT_AVAILABILITY,
  DEFAULT_DOWNTIME,
  DEFAULT_DURATION_UNIT,
  DEFAULT_PERIOD,
  DURATION_UNIT_OPTIONS,
  CREDIT_DISCLAIMER,
  NINES_PRESETS,
  PERIOD_OPTIONS,
  SLA_PRESETS,
  type DurationUnitOption,
} from './constants';
import {
  actualAvailability,
  downtimeBudget,
  formatDuration,
  highestSlaLevel,
  ninesToPercent,
  percentToNines,
  PERIOD_SECONDS,
  type DowntimeBudget,
  type PeriodKey,
  type SlaLevel,
} from './utils/sla';
import styles from './index.module.css';

/** 去掉浮点尾差，便于把秒数渲染为紧凑字符串 */
function trimNumber(value: number): string {
  return String(parseFloat(value.toPrecision(12)));
}

/** nines 展示：Infinity 渲染为文案，有限值保留合适有效位 */
function formatNines(nines: number): string {
  if (!Number.isFinite(nines)) {
    return '≥6 个 9';
  }
  return `${trimNumber(Number(nines.toPrecision(6)))} 个 9`;
}

/** 取错误信息字符串 */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 反向计算结果 */
interface ReverseOutcome {
  /** 实际可用性百分数 */
  availability: number;
  /** 9 的个数，零故障时为 Infinity */
  nines: number;
  /** 达到的最高 SLA 等级，未达最低档时为 undefined */
  level: SlaLevel | undefined;
  /** 归一化后的故障秒数 */
  downtimeSeconds: number;
}

/**
 * SLA 可用性与允许停机时间换算器：
 * 上半区由可用性目标计算日 / 周 / 月 / 年允许停机预算，
 * 下半区由实际故障时长与统计周期反算可用性、9 的个数与所达 SLA 等级。
 * 全部为主线程瞬时纯函数计算，无网络请求、无 Worker。
 *
 * @returns SLA 可用性换算交互界面
 */
const SlaUptimeCalculator: React.FC<ToolComponentProps> = () => {
  const [availability, setAvailability] = React.useState<number | null>(DEFAULT_AVAILABILITY);
  const [downtime, setDowntime] = React.useState<number | null>(DEFAULT_DOWNTIME);
  const [durationUnit, setDurationUnit] =
    React.useState<DurationUnitOption['key']>(DEFAULT_DURATION_UNIT);
  const [periodKey, setPeriodKey] = React.useState<PeriodKey>(DEFAULT_PERIOD);

  /** 上半区：可用性 → 四周期停机预算 */
  const budgetOutcome = React.useMemo<{
    budget?: DowntimeBudget;
    nines?: number;
    error?: string;
  }>(() => {
    if (availability === null) {
      return {};
    }
    try {
      const budget = downtimeBudget(availability);
      return { budget, nines: percentToNines(availability) };
    } catch (error) {
      return { error: toMessage(error) };
    }
  }, [availability]);

  /** 下半区：故障时长 + 周期 → 实际可用性 */
  const reverseOutcome = React.useMemo<{
    result?: ReverseOutcome;
    error?: string;
  }>(() => {
    if (downtime === null) {
      return {};
    }
    try {
      const unit = DURATION_UNIT_OPTIONS.find((item) => item.key === durationUnit);
      const factor = unit?.factor ?? 1;
      const downtimeSeconds = downtime * factor;
      const periodSeconds = PERIOD_SECONDS[periodKey];
      const { availability: actual, nines } = actualAvailability(
        downtimeSeconds,
        periodSeconds,
      );
      return {
        result: {
          availability: actual,
          nines,
          level: highestSlaLevel(actual),
          downtimeSeconds,
        },
      };
    } catch (error) {
      return { error: toMessage(error) };
    }
  }, [downtime, durationUnit, periodKey]);

  const creditColumns = [
    { title: 'SLA 档位', dataIndex: 'name', key: 'name' },
    {
      title: '可用性',
      dataIndex: 'availability',
      key: 'availability',
      render: (value: number) => <span className={styles.mono}>{value}%</span>,
    },
    { title: '参考服务积分档位', dataIndex: 'creditNote', key: 'creditNote' },
  ];

  return (
    <div className={styles.container}>
      <Card title="可用性目标 → 允许停机预算">
        <p className={styles.hint}>
          输入可用性目标（0–100% 之间，不含边界），自动计算每天、每周、每月（30
          天）、每年（365 天）允许的最大停机时间。停机比例 = 1 − 可用性 / 100。
        </p>

        <div className={styles.field}>
          <span className={styles.label}>可用性目标：</span>
          <InputNumber<number>
            className={styles.numberInput}
            addonAfter="%"
            precision={6}
            placeholder="如 99.9"
            value={availability}
            onChange={(value) => setAvailability(value === null ? null : Number(value))}
          />
          {budgetOutcome.nines !== undefined ? (
            <Tag color="blue">{formatNines(budgetOutcome.nines)}</Tag>
          ) : null}
        </div>

        <div className={styles.presetRow}>
          <span className={styles.label}>快捷预设：</span>
          {NINES_PRESETS.map((preset) => (
            <Button
              key={preset.nines}
              size="small"
              onClick={() => setAvailability(ninesToPercent(preset.nines))}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {budgetOutcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="无法计算停机预算"
            description={budgetOutcome.error}
          />
        ) : null}

        {budgetOutcome.budget ? (
          <div className={styles.fieldGrid} style={{ marginTop: 16 }}>
            {PERIOD_OPTIONS.map((period) => {
              const seconds = budgetOutcome.budget?.[period.key];
              return (
                <div key={period.key} className={styles.fieldCard}>
                  <div className={styles.fieldLabel}>{period.label}</div>
                  <div className={styles.budgetValue}>
                    {seconds === undefined ? '—' : formatDuration(seconds)}
                  </div>
                  <div className={styles.budgetSeconds}>
                    {seconds === undefined ? '' : `${trimNumber(seconds)} 秒`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <Table
          style={{ marginTop: 16 }}
          size="small"
          pagination={false}
          rowKey="availability"
          columns={creditColumns}
          dataSource={SLA_PRESETS}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>
          {CREDIT_DISCLAIMER}
        </p>
      </Card>

      <Card title="实际故障 → 可用性与 SLA 等级反算">
        <p className={styles.hint}>
          输入统计周期内实际发生的故障时长与周期长度，反算实际可用性百分比、「9
          的个数」以及达到的最高常见 SLA 等级。
        </p>

        <Space wrap size="middle">
          <div className={styles.field}>
            <span className={styles.label}>故障时长：</span>
            <InputNumber<number>
              className={styles.numberInput}
              min={0}
              precision={4}
              placeholder="如 31536"
              value={downtime}
              onChange={(value) => setDowntime(value === null ? null : Number(value))}
            />
            <Select
              style={{ width: 96 }}
              value={durationUnit}
              onChange={(value: DurationUnitOption['key']) => setDurationUnit(value)}
              options={DURATION_UNIT_OPTIONS.map((item) => ({
                label: item.label,
                value: item.key,
              }))}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>统计周期：</span>
            <Select
              style={{ width: 220 }}
              value={periodKey}
              onChange={(value: PeriodKey) => setPeriodKey(value)}
              options={PERIOD_OPTIONS.map((item) => ({
                label: item.label,
                value: item.key,
              }))}
            />
          </div>
        </Space>

        {reverseOutcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="无法反算可用性"
            description={reverseOutcome.error}
          />
        ) : null}

        {reverseOutcome.result ? (
          <Descriptions style={{ marginTop: 16 }} bordered column={2} size="small">
            <Descriptions.Item label="实际可用性">
              <span className={styles.mono}>
                {reverseOutcome.result.availability.toFixed(4)}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="9 的个数">
              <span className={styles.mono}>{formatNines(reverseOutcome.result.nines)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="故障时长（归一化）">
              <span className={styles.mono}>
                {formatDuration(reverseOutcome.result.downtimeSeconds)}（
                {trimNumber(reverseOutcome.result.downtimeSeconds)} 秒）
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="所达最高 SLA 等级">
              {reverseOutcome.result.level ? (
                <Tag color="green">
                  {reverseOutcome.result.level.availability}%（
                  {formatNines(reverseOutcome.result.level.nines)}）
                </Tag>
              ) : (
                <Tag color="red">未达 99% 档位</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>
    </div>
  );
};

export default SlaUptimeCalculator;
