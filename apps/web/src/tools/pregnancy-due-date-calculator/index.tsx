'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Progress,
  Radio,
  Statistic,
  Table,
  Tag,
} from 'antd';
import {
  CYCLE_HINT,
  DEFAULT_CYCLE_DAYS,
  MAX_CYCLE_DAYS,
  MEDICAL_DISCLAIMER,
  MIN_CYCLE_DAYS,
  MODE_OPTIONS,
  TRIMESTER_LABELS,
} from './constants';
import {
  calculatePregnancy,
  CHECKUP_MILESTONES,
  formatDate,
  isWeekInMilestone,
  type InputMode,
  type PregnancyResult,
} from './utils/pregnancy';
import styles from './index.module.css';

/** 取本地今天的 YYYY-MM-DD，用于 date 输入框默认值 */
function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 取错误信息字符串 */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 预产期与孕周计算器：
 * 支持末次月经（Naegele +280 天）与排卵日（+266 天）双模式，
 * 按参考日期给出孕周、孕天、三月期、倒计时与 40 周进度，
 * 支持 21–35 天月经周期修正并渲染产检节点时间线。
 * 全部为本地日期纯函数运算，无网络请求、无 Worker。
 *
 * @returns 预产期计算交互界面
 */
const PregnancyDueDateCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<InputMode>('lmp');
  const [baseDate, setBaseDate] = React.useState<string>('2026-01-01');
  const [referenceDate, setReferenceDate] = React.useState<string>(
    todayInputValue(),
  );
  const [cycleDays, setCycleDays] = React.useState<number>(DEFAULT_CYCLE_DAYS);

  const outcome = React.useMemo<{ result?: PregnancyResult; error?: string }>(
    () => {
      try {
        return {
          result: calculatePregnancy({
            mode,
            baseDateInput: baseDate,
            referenceDateInput: referenceDate,
            cycleDays,
          }),
        };
      } catch (error) {
        return { error: toMessage(error) };
      }
    },
    [mode, baseDate, referenceDate, cycleDays],
  );

  const result = outcome.result;

  const milestoneRows = React.useMemo(
    () =>
      CHECKUP_MILESTONES.map((milestone) => ({
        key: milestone.name,
        name: milestone.name,
        window: `孕 ${milestone.startWeek}–${milestone.endWeek} 周`,
        note: milestone.note,
        active: result
          ? isWeekInMilestone(milestone, result.gestationalWeek)
          : false,
      })),
    [result],
  );

  return (
    <div className={styles.container}>
      <Card title="输入信息">
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>推算模式</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={mode}
              onChange={(event) => setMode(event.target.value as InputMode)}
              options={MODE_OPTIONS}
            />
          </div>
        </div>

        <div className={styles.fieldRow} style={{ marginTop: 16 }}>
          <div className={styles.field}>
            <span className={styles.label}>
              {mode === 'lmp' ? '末次月经第一天' : '排卵 / 受孕日期'}
            </span>
            <Input
              type="date"
              style={{ width: 180 }}
              value={baseDate}
              onChange={(event) => setBaseDate(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>参考日期（默认今天）</span>
            <Input
              type="date"
              style={{ width: 180 }}
              value={referenceDate}
              onChange={(event) => setReferenceDate(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>月经周期（天）</span>
            <InputNumber
              min={MIN_CYCLE_DAYS}
              max={MAX_CYCLE_DAYS}
              precision={0}
              style={{ width: 140 }}
              value={cycleDays}
              onChange={(value) =>
                setCycleDays(value === null ? DEFAULT_CYCLE_DAYS : Number(value))
              }
            />
          </div>
        </div>
        <p className={styles.hint} style={{ marginTop: 8 }}>
          {CYCLE_HINT}
        </p>
      </Card>

      <Alert type="info" showIcon message={MEDICAL_DISCLAIMER} />

      {outcome.error ? (
        <Alert type="error" showIcon message="无法计算" description={outcome.error} />
      ) : null}

      {result ? (
        <>
          <Card title="预产期与孕周仪表盘">
            <div className={styles.statGrid}>
              <Statistic
                title="预产期（EDD）"
                value={formatDate(result.dueDate)}
              />
              <Statistic title="推算末次月经" value={formatDate(result.lmp)} />
              <Statistic
                title="距预产期"
                value={Math.abs(result.daysUntilDue)}
                suffix={result.daysUntilDue >= 0 ? '天' : '天（已过）'}
              />
              <Statistic
                title="当前孕期"
                valueRender={() => (
                  <span className={styles.weekBadge}>
                    <span className={styles.weekNumber}>
                      {result.gestationalWeek}
                    </span>
                    <span className={styles.weekUnit}>
                      周 {result.gestationalDay} 天
                    </span>
                  </span>
                )}
              />
            </div>

            <Progress percent={result.progressPercent} strokeColor="#db2777" />

            <Descriptions
              style={{ marginTop: 12 }}
              size="small"
              column={1}
              bordered
              items={[
                {
                  key: 'trimester',
                  label: '三月期',
                  children: (
                    <Tag color="pink">
                      {TRIMESTER_LABELS[result.trimester] ?? `第 ${result.trimester} 孕期`}
                    </Tag>
                  ),
                },
                {
                  key: 'cycle',
                  label: '周期修正',
                  children:
                    result.cycleAdjustmentDays === 0
                      ? '标准 28 天周期，未修正'
                      : `基准预产期 ${formatDate(result.baselineDueDate)} → 修正后 ${formatDate(result.dueDate)}（${result.cycleAdjustmentDays > 0 ? '延后' : '提前'} ${Math.abs(result.cycleAdjustmentDays)} 天）`,
                },
                {
                  key: 'elapsed',
                  label: '已孕天数',
                  children: `${result.dayOfPregnancy} 天（自末次月经起算）`,
                },
              ]}
            />
          </Card>

          <Card title="40 周孕期时间线与产检节点">
            <p className={styles.hint}>
              节点按孕周时间窗呈现，具体检查日期请遵产检医院医嘱；当前参考日期所在周以粉色高亮。
            </p>
            <div className={styles.tableWrap}>
              <Table
                size="small"
                pagination={false}
                dataSource={milestoneRows}
                rowClassName={(record) =>
                  record.active
                    ? (styles.weekRowCurrent ?? '')
                    : (styles.weekRow ?? '')
                }
                columns={[
                  { title: '产检节点', dataIndex: 'name', key: 'name' },
                  {
                    title: '常规时间窗',
                    dataIndex: 'window',
                    key: 'window',
                    render: (value: string) => (
                      <span className={styles.mono}>{value}</span>
                    ),
                  },
                  { title: '说明', dataIndex: 'note', key: 'note' },
                  {
                    title: '当前状态',
                    dataIndex: 'active',
                    key: 'active',
                    render: (active: boolean) =>
                      active ? <Tag color="pink">窗口内</Tag> : <Tag>未到</Tag>,
                  },
                ]}
              />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default PregnancyDueDateCalculator;
