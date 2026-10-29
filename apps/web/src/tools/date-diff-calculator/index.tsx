'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Radio,
  Select,
  Space,
  Tabs,
  Tag,
} from 'antd';
import {
  addOffset,
  countTotalDays,
  countTotalHours,
  countTotalMinutes,
  countWeekdays,
  differenceBreakdown,
  formatDate,
  isoWeekday,
  parseDateInput,
  type OffsetUnit,
} from './utils/dateMath';
import {
  DEFAULT_BASE_DATE,
  DEFAULT_END,
  DEFAULT_OFFSET_AMOUNT,
  DEFAULT_OFFSET_UNIT,
  DEFAULT_START,
  OFFSET_UNIT_OPTIONS,
  WEEKDAY_NAMES,
} from './constants';
import styles from './index.module.css';

type Precision = 'day' | 'minute';

interface OffsetEntry {
  id: number;
  amount: string;
  unit: OffsetUnit;
}

const ResultCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={styles.resultCard}>
    <div className={styles.resultLabel}>{label}</div>
    <div className={styles.resultValue}>{value}</div>
  </div>
);

/**
 * 日期时间差计算与日期加减计算器：
 * Tab 1 计算两个日期时间的差量分解与总量（含工作日、含起止日开关）；
 * Tab 2 对基准日期施加多个带单位的正负偏移，月末按日历月钳制。
 * 全部在浏览器本地、基于 UTC 毫秒完成。
 *
 * @param props - 工具组件属性
 * @returns 日期计算交互界面
 */
const DateDiffCalculator: React.FC<ToolComponentProps> = () => {
  // —— Tab 1：日期差 ——
  const [precision, setPrecision] = React.useState<Precision>('day');
  const [startValue, setStartValue] = React.useState<string>(DEFAULT_START);
  const [endValue, setEndValue] = React.useState<string>(DEFAULT_END);
  const [includeEndpoints, setIncludeEndpoints] = React.useState<boolean>(false);
  const [weekdaysOnly, setWeekdaysOnly] = React.useState<boolean>(false);

  // —— Tab 2：日期加减 ——
  const [baseValue, setBaseValue] = React.useState<string>(DEFAULT_BASE_DATE);
  const [offsetEntries, setOffsetEntries] = React.useState<OffsetEntry[]>([
    { id: 1, amount: DEFAULT_OFFSET_AMOUNT, unit: DEFAULT_OFFSET_UNIT },
  ]);
  const nextOffsetId = React.useRef(2);

  const withTime = precision === 'minute';

  const diff = React.useMemo(() => {
    const start = parseDateInput(startValue);
    const end = parseDateInput(endValue);
    if (!start || !end) {
      return null;
    }
    const breakdown = differenceBreakdown(start, end);
    const direction = end.getTime() < start.getTime() ? -1 : 1;
    const totalDays = countTotalDays(start, end) + (includeEndpoints ? direction : 0);
    const weekdays =
      countWeekdays(start, end) +
      (includeEndpoints && isoWeekday(end) <= 5 ? direction : 0);
    return {
      sameDay: end.getTime() === start.getTime(),
      direction,
      breakdown,
      totalDays,
      totalHours: countTotalHours(start, end),
      totalMinutes: countTotalMinutes(start, end),
      weekdays,
    };
  }, [startValue, endValue, includeEndpoints]);

  const offsetResult = React.useMemo(() => {
    const base = parseDateInput(baseValue);
    if (!base) {
      return null;
    }
    const parsed = offsetEntries.map((entry) => {
      const amount = Number(entry.amount);
      return {
        entry,
        valid: entry.amount.trim() !== '' && Number.isFinite(amount),
        amount,
      };
    });
    if (parsed.some((item) => !item.valid)) {
      return { base, target: null as Date | null };
    }
    const target = parsed.reduce(
      (date, item) => addOffset(date, item.amount, item.entry.unit),
      base,
    );
    return { base, target };
  }, [baseValue, offsetEntries]);

  const updateOffset = (id: number, patch: Partial<Omit<OffsetEntry, 'id'>>) => {
    setOffsetEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const addOffsetEntry = () => {
    const id = nextOffsetId.current;
    nextOffsetId.current += 1;
    setOffsetEntries((entries) => [
      ...entries,
      { id, amount: DEFAULT_OFFSET_AMOUNT, unit: 'days' },
    ]);
  };

  const removeOffsetEntry = (id: number) => {
    setOffsetEntries((entries) => entries.filter((entry) => entry.id !== id));
  };

  return (
    <div className={styles.container}>
      <Card title="日期时间差计算与日期加减计算器">
        <Tabs
          items={[
            {
              key: 'diff',
              label: '日期差',
              children: (
                <div className={styles.container}>
                  <div className={styles.dateRow}>
                    <Radio.Group
                      value={precision}
                      onChange={(event) => {
                        const next = event.target.value as Precision;
                        setPrecision(next);
                        if (next === 'day') {
                          setStartValue((v) => v.slice(0, 10));
                          setEndValue((v) => v.slice(0, 10));
                        } else {
                          setStartValue((v) =>
                            v.length === 10 ? `${v}T00:00` : v,
                          );
                          setEndValue((v) => (v.length === 10 ? `${v}T00:00` : v));
                        }
                      }}
                      optionType="button"
                      buttonStyle="solid"
                      size="small"
                    >
                      <Radio.Button value="day">精确到日</Radio.Button>
                      <Radio.Button value="minute">精确到分钟</Radio.Button>
                    </Radio.Group>
                  </div>

                  <div className={styles.dateRow}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>起始日期{withTime ? '时间' : ''}</span>
                      <Input
                        type={withTime ? 'datetime-local' : 'date'}
                        className={styles.dateInput}
                        value={startValue}
                        onChange={(event) => setStartValue(event.target.value)}
                      />
                    </div>
                    <span>→</span>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>结束日期{withTime ? '时间' : ''}</span>
                      <Input
                        type={withTime ? 'datetime-local' : 'date'}
                        className={styles.dateInput}
                        value={endValue}
                        onChange={(event) => setEndValue(event.target.value)}
                      />
                    </div>
                  </div>

                  <Space wrap>
                    <Checkbox
                      checked={includeEndpoints}
                      onChange={(event) => setIncludeEndpoints(event.target.checked)}
                    >
                      包含起止两天（总天数 +1）
                    </Checkbox>
                    <Checkbox
                      checked={weekdaysOnly}
                      onChange={(event) => setWeekdaysOnly(event.target.checked)}
                    >
                      仅统计工作日（周一至周五，不含节假日）
                    </Checkbox>
                  </Space>

                  {diff === null ? (
                    <Alert type="warning" showIcon message="请选择有效的起始与结束日期" />
                  ) : (
                    <>
                      {diff.sameDay ? (
                        <Tag color="blue">两个日期相同，差为 0</Tag>
                      ) : (
                        <Tag color={diff.direction === 1 ? 'green' : 'orange'}>
                          {diff.direction === 1 ? '结束日晚于起始日' : '结束日早于起始日（结果为负）'}
                        </Tag>
                      )}
                      <div className={styles.resultGrid}>
                        <ResultCard
                          label="年 / 月 / 日 分解"
                          value={`${diff.breakdown.years} 年 ${diff.breakdown.months} 月 ${diff.breakdown.days} 日`}
                        />
                        {!weekdaysOnly && (
                          <>
                            <ResultCard label="总天数" value={`${diff.totalDays} 天`} />
                            {withTime && (
                              <>
                                <ResultCard label="总小时" value={`${diff.totalHours} 小时`} />
                                <ResultCard label="总分钟" value={`${diff.totalMinutes} 分钟`} />
                              </>
                            )}
                          </>
                        )}
                        <ResultCard label="工作日天数" value={`${diff.weekdays} 天`} />
                      </div>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'offset',
              label: '日期加减',
              children: (
                <div className={styles.container}>
                  <div className={styles.field} style={{ maxWidth: 220 }}>
                    <span className={styles.fieldLabel}>基准日期</span>
                    <Input
                      type="date"
                      value={baseValue}
                      onChange={(event) => setBaseValue(event.target.value)}
                    />
                  </div>

                  {offsetEntries.map((entry, index) => (
                    <div key={entry.id} className={styles.offsetRow}>
                      <span className={styles.fieldLabel}>
                        {index === 0 ? '加上' : '再加'}
                      </span>
                      <Input
                        className={styles.offsetAmount}
                        value={entry.amount}
                        onChange={(event) =>
                          updateOffset(entry.id, { amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="整数，可为负"
                      />
                      <Select<OffsetUnit>
                        className={styles.offsetUnit}
                        value={entry.unit}
                        onChange={(value) => updateOffset(entry.id, { unit: value })}
                        options={OFFSET_UNIT_OPTIONS}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 size={15} />}
                        disabled={offsetEntries.length === 1}
                        onClick={() => removeOffsetEntry(entry.id)}
                      />
                    </div>
                  ))}

                  <div>
                    <Button type="dashed" icon={<Plus size={15} />} onClick={addOffsetEntry}>
                      添加一段偏移
                    </Button>
                  </div>

                  {offsetResult === null ? (
                    <Alert type="warning" showIcon message="请选择有效的基准日期" />
                  ) : offsetResult.target === null ? (
                    <Alert type="warning" showIcon message="请将每段偏移量填写为整数（支持负数）" />
                  ) : (
                    <div className={styles.targetCard}>
                      <div className={styles.fieldLabel}>目标日期</div>
                      <div className={styles.targetDate}>
                        {formatDate(offsetResult.target, false)}
                      </div>
                      <Tag color="blue" style={{ marginTop: 8 }}>
                        {WEEKDAY_NAMES[isoWeekday(offsetResult.target)]}
                      </Tag>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
        <div className={styles.muted} style={{ marginTop: 12 }}>
          所有计算均在浏览器本地基于 UTC 毫秒时间戳完成，不受浏览器时区与夏令时影响。
          年、月偏移遇目标月天数不足时钳制到月末（如 2024-01-31 加 1 个月 → 2024-02-29，
          2024-02-29 加 1 年 → 2025-02-28）；工作日仅按周一至周五统计，不含法定节假日调休。
        </div>
      </Card>
    </div>
  );
};

export default DateDiffCalculator;
