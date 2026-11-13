'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, message, Tag } from 'antd';
import { Clock, Copy, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import {
  createEmptySegment,
  DEFAULT_HOURLY_RATE,
  DEFAULT_SEGMENTS,
  TIME_PLACEHOLDER,
} from './constants';
import {
  calculateAll,
  estimatePay,
  formatDuration,
  summarize,
  toHours,
  type WorkSegment,
} from './utils/workHours';
import styles from './index.module.css';

const WorkHoursCalculator: React.FC = () => {
  const [segments, setSegments] = React.useState<WorkSegment[]>(DEFAULT_SEGMENTS);
  const [hourlyRate, setHourlyRate] = React.useState<number>(DEFAULT_HOURLY_RATE);

  const results = React.useMemo(() => calculateAll(segments), [segments]);
  const summary = React.useMemo(() => summarize(results), [results]);
  const pay = React.useMemo(
    () => estimatePay(summary.totalNetMinutes, hourlyRate),
    [summary.totalNetMinutes, hourlyRate],
  );

  const updateSegment = (index: number, patch: Partial<WorkSegment>) => {
    setSegments((previous) =>
      previous.map((segment, i) => (i === index ? { ...segment, ...patch } : segment)),
    );
  };

  const addSegment = () => setSegments((previous) => [...previous, createEmptySegment()]);

  const removeSegment = (index: number) => {
    setSegments((previous) => previous.filter((_, i) => i !== index));
  };

  const resetSamples = () => setSegments(DEFAULT_SEGMENTS);

  const clearAll = () => setSegments([createEmptySegment()]);

  /** 生成可粘贴到表格软件的 TSV 文本 */
  const buildTableText = (): string => {
    const header = ['序号', '上班时间', '下班时间', '休息(分钟)', '净工时(分钟)', '净工时', '备注'];
    const lines = results.map((result) => {
      const note = result.error
        ? result.error
        : result.crossedMidnight
          ? '跨午夜（自动 +1 天）'
          : '';
      return [
        String(result.index + 1),
        result.segment.start,
        result.segment.end,
        String(result.segment.breakMinutes),
        result.error ? '' : String(result.netMinutes),
        result.error ? '' : formatDuration(result.netMinutes),
        note,
      ].join('\t');
    });
    lines.push(
      [
        '汇总',
        '',
        '',
        String(summary.totalBreakMinutes),
        String(summary.totalNetMinutes),
        formatDuration(summary.totalNetMinutes),
        `有效 ${summary.validCount} 段，日均 ${formatDuration(summary.averageMinutes)}`,
      ].join('\t'),
    );
    lines.push(['工资估算', '', '', '', '', '', `费率 ${hourlyRate} 元/小时，合计 ${pay} 元`].join('\t'));
    return [header.join('\t'), ...lines].join('\n');
  };

  const copyTable = () => {
    copyToClipboard(buildTableText());
    message.success('已复制表格文本（TSV，可粘贴到 Excel/表格）');
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="工时时长累加器"
        description="按行录入多组上下班打卡时间（HH:mm），自动扣除每段休息分钟数并累加净工时；下班时间早于上班时间时按跨午夜自动 +1 天，逐行提示异常，并汇总总工时、总休息、日均工时与按小时费率估算的工资。全程本地计算。"
      />

      <Card
        size="small"
        title={
          <span>
            <Clock size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            打卡记录
          </span>
        }
        extra={
          <div className={styles.toolbar}>
            <Button size="small" icon={<Plus size={13} />} onClick={addSegment}>
              添加一段
            </Button>
            <Button size="small" icon={<RotateCcw size={13} />} onClick={resetSamples}>
              示例
            </Button>
            <Button size="small" onClick={clearAll}>
              清空
            </Button>
            <Button size="small" type="primary" icon={<Copy size={13} />} onClick={copyTable}>
              复制表格
            </Button>
          </div>
        }
      >
        <div className={`${styles.rowGrid} ${styles.headerRow}`}>
          <span>#</span>
          <span>上班时间</span>
          <span>下班时间</span>
          <span>休息（分钟）</span>
          <span>本段净工时</span>
          <span />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {results.map((result) => (
            <div
              key={result.index}
              className={`${styles.rowGrid} ${styles.segmentRow} ${
                result.error ? styles.segmentRowInvalid : ''
              }`}
            >
              <span className={styles.rowIndex}>{result.index + 1}</span>
              <Input
                size="small"
                value={result.segment.start}
                placeholder={TIME_PLACEHOLDER}
                maxLength={5}
                onChange={(e) => updateSegment(result.index, { start: e.target.value })}
              />
              <Input
                size="small"
                value={result.segment.end}
                placeholder={TIME_PLACEHOLDER}
                maxLength={5}
                onChange={(e) => updateSegment(result.index, { end: e.target.value })}
              />
              <InputNumber
                size="small"
                min={0}
                precision={0}
                style={{ width: '100%' }}
                value={result.segment.breakMinutes}
                onChange={(value) =>
                  updateSegment(result.index, { breakMinutes: value ?? 0 })
                }
              />
              <div className={styles.resultCell}>
                {result.error ? (
                  <span className={styles.errorText}>{result.error}</span>
                ) : (
                  <>
                    <span className={styles.netTime}>
                      {formatDuration(result.netMinutes)}
                      <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.65 }}>
                        {toHours(result.netMinutes)} 小时
                      </span>
                    </span>
                    <div className={styles.badges}>
                      {result.crossedMidnight ? <Tag color="purple">跨午夜 +1 天</Tag> : null}
                      {result.segment.breakMinutes > 0 ? (
                        <Tag>休息 {result.segment.breakMinutes} 分</Tag>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
              <Button
                size="small"
                danger
                type="text"
                icon={<Trash2 size={14} />}
                onClick={() => removeSegment(result.index)}
                disabled={segments.length <= 1}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card size="small" title="汇总与工资估算">
        <div className={styles.rateRow} style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 13 }}>小时费率（元/小时）</span>
          <InputNumber
            size="small"
            min={0}
            precision={2}
            style={{ width: 140 }}
            value={hourlyRate}
            onChange={(value) => setHourlyRate(value ?? 0)}
          />
          <span style={{ fontSize: 12, opacity: 0.55 }}>仅按净工时估算，不含加班倍率与税费</span>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>总净工时</div>
            <div className={styles.statValue}>{formatDuration(summary.totalNetMinutes)}</div>
            <div className={styles.statSub}>{toHours(summary.totalNetMinutes)} 小时</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>总休息时长</div>
            <div className={styles.statValue}>{formatDuration(summary.totalBreakMinutes)}</div>
            <div className={styles.statSub}>已从在岗时长中扣除</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>日均净工时</div>
            <div className={styles.statValue}>{formatDuration(summary.averageMinutes)}</div>
            <div className={styles.statSub}>基于 {summary.validCount} 个有效段</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>工资估算</div>
            <div className={styles.statValue}>{pay} 元</div>
            <div className={styles.statSub}>
              {toHours(summary.totalNetMinutes)} 小时 × {hourlyRate} 元/小时
            </div>
          </div>
        </div>

        <Alert
          style={{ marginTop: 14 }}
          type="warning"
          showIcon
          message="计算口径"
          description="同一时刻的上下班按 24 小时班次处理；休息分钟超过在岗时长时该段净工时归零，不产生负工时；存在错误的打卡段不计入汇总与工资。"
        />
      </Card>
    </div>
  );
};

export default WorkHoursCalculator;
