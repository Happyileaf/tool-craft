'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Space, Table, Tag } from 'antd';
import { BPM_MAX, BPM_MIN, BPM_PRESETS, BPM_STEP, DEFAULT_BPM } from './constants';
import {
  beatMs,
  bpmFromDuration,
  formatHz,
  formatMs,
  noteTable,
  syncTimes,
  type NoteDuration,
  type NoteKind,
  type SyncTime,
} from './utils/bpm';
import styles from './index.module.css';

const KIND_META: Record<NoteKind, { label: string; color: string }> = {
  normal: { label: '常规', color: 'blue' },
  dotted: { label: '附点', color: 'orange' },
  triplet: { label: '三连音', color: 'purple' },
};

/**
 * BPM 音符时长与延迟时间计算器
 *
 * @returns BPM 计算交互界面
 */
const BpmCalculator: React.FC<ToolComponentProps> = () => {
  const [bpm, setBpm] = React.useState<number>(DEFAULT_BPM);
  const [quarterMsInput, setQuarterMsInput] = React.useState<number | null>(500);

  const outcome = React.useMemo(() => {
    try {
      return {
        rows: noteTable(bpm),
        times: syncTimes(bpm),
        quarter: beatMs(bpm),
        error: undefined as string | undefined,
      };
    } catch (error) {
      return {
        rows: [],
        times: [],
        quarter: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [bpm]);

  const reverseOutcome = React.useMemo(() => {
    if (quarterMsInput === null || !Number.isFinite(quarterMsInput)) {
      return { value: undefined as number | undefined, error: '请输入四分音符时长（毫秒）' };
    }
    try {
      return { value: bpmFromDuration(quarterMsInput, 1), error: undefined };
    } catch (error) {
      return { value: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [quarterMsInput]);

  const noteColumns = [
    { title: '类型', key: 'kind', width: 90, render: (_: unknown, record: NoteDuration) => (
      <Tag color={KIND_META[record.kind].color}>{KIND_META[record.kind].label}</Tag>
    ) },
    { title: '音符', dataIndex: 'label', key: 'label' },
    { title: '拍数', dataIndex: 'beats', key: 'beats', width: 100,
      render: (value: number) => <span className={styles.mono}>{value}</span> },
    { title: '时长', key: 'ms', width: 130,
      render: (_: unknown, record: NoteDuration) => (
        <span className={styles.mono}>{formatMs(record.ms)}</span>
      ) },
    { title: '频率', key: 'hz',
      render: (_: unknown, record: NoteDuration) => (
        <span className={styles.mono}>{formatHz(record.hz)}</span>
      ) },
  ];

  return (
    <div className={styles.container}>
      <Card title="BPM 音符时长与延迟时间计算器">
        <p className={styles.hint}>
          输入 BPM（每分钟拍数，以四分音符为一拍），自动计算全音符到三十二分音符（含附点、三连音）的毫秒时长，
          并给出 Delay / Reverb 效果器常用的节拍同步时间；也可在下方由四分音符时长反算 BPM。
        </p>
        <Space align="center" wrap>
          <span className={styles.label}>BPM</span>
          <InputNumber
            min={BPM_MIN}
            max={BPM_MAX}
            step={BPM_STEP}
            value={bpm}
            onChange={(value) => setBpm(typeof value === 'number' ? value : 0)}
            style={{ width: 120 }}
          />
          <span className={styles.mono}>
            一拍 = {outcome.error ? '—' : formatMs(outcome.quarter)}
          </span>
        </Space>
        <div className={styles.presetRow}>
          {BPM_PRESETS.map((preset) => (
            <Button key={preset.name} size="small" onClick={() => setBpm(preset.bpm)}>
              {preset.name}
            </Button>
          ))}
        </div>
        {outcome.error ? (
          <Alert style={{ marginTop: 12 }} type="warning" showIcon message={outcome.error} />
        ) : null}
      </Card>

      {!outcome.error ? (
        <Card title="效果器节拍同步时间（Delay / Reverb）">
          <Table
            rowKey="label"
            size="small"
            pagination={false}
            dataSource={outcome.times}
            columns={[
              { title: '档位', dataIndex: 'label', key: 'label' },
              { title: '拍数', dataIndex: 'beats', key: 'beats', width: 100,
                render: (value: number) => <span className={styles.mono}>{value}</span> },
              { title: '时长', key: 'ms', width: 140,
                render: (_: unknown, record: SyncTime) => (
                  <span className={styles.mono}>{formatMs(record.ms)}</span>
                ) },
              { title: '同步频率', key: 'hz',
                render: (_: unknown, record: SyncTime) => (
                  <span className={styles.mono}>{formatHz(record.hz)}</span>
                ) },
            ]}
          />
          <p className={styles.hint} style={{ margin: '12px 0 0' }}>
            标注 D 为附点（原时长 ×1.5），T 为三连音（原时长 ×2/3）；电音中常用的「1/8D 延迟」即八分附点档位。
          </p>
        </Card>
      ) : null}

      {!outcome.error ? (
        <Card title="全部音符时长表">
          <Table
            rowKey={(record) => `${record.kind}-${record.label}`}
            size="small"
            pagination={false}
            dataSource={outcome.rows}
            columns={noteColumns}
          />
        </Card>
      ) : null}

      <Card title="由四分音符时长反算 BPM">
        <Space align="center" wrap>
          <span className={styles.label}>四分音符时长（ms）</span>
          <InputNumber
            min={1}
            step={1}
            value={quarterMsInput}
            onChange={(value) => setQuarterMsInput(value)}
            style={{ width: 160 }}
          />
          {reverseOutcome.error ? (
            <Tag color="orange">{reverseOutcome.error}</Tag>
          ) : (
            <Tag color="green">BPM ≈ {reverseOutcome.value?.toFixed(3)}</Tag>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default BpmCalculator;
