'use client';

import { Alert, Button, Card, Checkbox, Input, InputNumber, Segmented, Space, Switch, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  CYCLE_OPTIONS,
  DEFAULT_BUFFER_MINUTES,
  DEFAULT_WAKE_TIME,
  calculateSleepPlans,
  formatDayOffset,
  formatSleepDuration,
  parseClock,
} from './utils/sleep';
import type { SleepDirection, SleepPlan } from './utils/sleep';
import styles from './index.module.css';

type CalcResult = { ok: true; plans: SleepPlan[] } | { ok: false; error: string };

export default function SleepCycleCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [direction, setDirection] = useState<SleepDirection>('wake');
  const [time, setTime] = useState(defaultInput ?? DEFAULT_WAKE_TIME);
  const [bufferMinutes, setBufferMinutes] = useState(DEFAULT_BUFFER_MINUTES);
  const [cycles, setCycles] = useState<number[]>([...CYCLE_OPTIONS]);
  const [use12Hour, setUse12Hour] = useState(false);

  const result = useMemo<CalcResult>(() => {
    try {
      return {
        ok: true,
        plans: calculateSleepPlans(direction, parseClock(time), bufferMinutes, cycles, use12Hour),
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [direction, time, bufferMinutes, cycles, use12Hour]);

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const lines = result.plans.map(
      (plan) =>
        `${plan.cycles} 个周期（${formatSleepDuration(plan.totalSleepMinutes)}）：${formatDayOffset(
          plan.dayOffset,
        )} ${plan.clock}`,
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="作息推算">
        <Space wrap className={styles.modeRow}>
          <Segmented
            value={direction}
            onChange={(value) => setDirection(value as SleepDirection)}
            options={[
              { label: '按起床时间倒推', value: 'wake' },
              { label: '按就寝时间正推', value: 'bed' },
            ]}
          />
          <span className={styles.switchLabel}>
            <Switch checked={use12Hour} onChange={setUse12Hour} size="small" />
            12 小时制
          </span>
        </Space>

        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>
              {direction === 'wake' ? '目标起床时间' : '计划就寝时间'}
            </span>
            <Input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="HH:MM，如 07:00"
              className={styles.timeInput}
              allowClear
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>入睡缓冲（分钟）</span>
            <InputNumber
              min={0}
              max={60}
              value={bufferMinutes}
              onChange={(value) => setBufferMinutes(value ?? DEFAULT_BUFFER_MINUTES)}
              style={{ width: 140 }}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>展示周期数</span>
            <Checkbox.Group
              value={cycles}
              onChange={(values) => setCycles(values as number[])}
              options={CYCLE_OPTIONS.map((value) => ({ label: `${value} 个`, value }))}
            />
          </div>
        </div>

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.plans}>
              {result.plans.map((plan) => (
                <div key={plan.cycles} className={styles.plan}>
                  <span className={styles.planCycles}>{plan.cycles} 个周期</span>
                  <span className={styles.planClock}>{plan.clock}</span>
                  <Space size={4} wrap>
                    <Tag color={plan.dayOffset === 0 ? 'blue' : 'orange'}>
                      {formatDayOffset(plan.dayOffset)}
                    </Tag>
                    <Tag>{formatSleepDuration(plan.totalSleepMinutes)}</Tag>
                  </Space>
                </div>
              ))}
            </div>
            <Button onClick={handleCopy}>复制全部结果</Button>
          </>
        )}
      </Card>

      <Card size="small" title="计算说明">
        <ul className={styles.notes}>
          <li>一个完整睡眠周期按 90 分钟计，建议安排 4–6 个周期，即约 6–9 小时睡眠。</li>
          <li>入睡缓冲用于预留上床到入睡的时间（默认 15 分钟），倒推时会从目标起床时间中扣除。</li>
          <li>若推算结果跨过午夜，会标注「前一日」或「次日」，并自动按 24 小时制回绕。</li>
          <li>作息受个体差异、年龄与睡眠质量影响，结果仅作为安排参考。</li>
        </ul>
      </Card>
    </div>
  );
}
