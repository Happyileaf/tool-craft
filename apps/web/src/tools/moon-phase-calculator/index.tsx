'use client';

import React from 'react';
import { Alert, Card, Space, Statistic, Table, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  SYNODIC_MONTH,
  formatUTCDate,
  getMoonPhaseFromDate,
  getNearestPhases,
  moonClipPath,
  dateToJulianDay,
} from './utils/moonPhase';
import { MODEL_NOTE, PHASE_THEME } from './constants';
import styles from './index.module.css';

/** 取当前 UTC 日历日的 YYYY-MM-DD。 */
function todayUTC(): string {
  return formatUTCDate(new Date());
}

/** 把 <input type="date"> 的 YYYY-MM-DD 按 UTC 构造 Date（当日 UTC 12:00 归一）。 */
function pickToUTCDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

const MoonPhaseCalculator: React.FC<ToolComponentProps> = () => {
  const [picked, setPicked] = React.useState<string>(todayUTC);

  const utcDate = React.useMemo(() => pickToUTCDate(picked), [picked]);
  const phase = React.useMemo(() => getMoonPhaseFromDate(utcDate), [utcDate]);
  const nearest = React.useMemo(() => getNearestPhases(dateToJulianDay(utcDate)), [utcDate]);
  const theme = PHASE_THEME[phase.phase];

  const phaseRows = [
    { key: 'last-new', name: '上一次新月', date: nearest.lastNewMoon, delta: phase.daysSinceNewMoon },
    { key: 'next-new', name: '下一次新月', date: nearest.nextNewMoon, delta: phase.daysUntilNewMoon },
    { key: 'last-full', name: '上一次满月', date: nearest.lastFullMoon, delta: undefined },
    { key: 'next-full', name: '下一次满月', date: nearest.nextFullMoon, delta: undefined },
  ];

  return (
    <div className={styles.container}>
      <Card size="small">
        <Space wrap align="center">
          <span>选择公历日期：</span>
          <input
            type="date"
            className={styles.dateInput}
            value={picked}
            onChange={(e) => e.target.value && setPicked(e.target.value)}
          />
          <span className={styles.hint}>按 UTC 日历日计算</span>
        </Space>
      </Card>

      <Card size="small">
        <div className={styles.hero}>
          <div className={styles.moonWrap}>
            <div className={styles.moon} aria-label={`月相示意：${phase.phaseNameZh}`}>
              <div className={styles.lit} style={{ clipPath: moonClipPath(phase.age) }} />
            </div>
            <Tag color={theme.color} style={{ fontSize: 14, padding: '2px 12px' }}>
              {theme.emoji} {phase.phaseNameZh}
            </Tag>
            <span className={styles.phaseNameEn}>{phase.phaseNameEn}</span>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>月龄</span>
              <span className={styles.statValue}>{phase.age.toFixed(2)} 天</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>照亮比例</span>
              <span className={styles.statValue}>{(phase.illumination * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>距上一次新月</span>
              <span className={styles.statValue}>{phase.daysSinceNewMoon.toFixed(1)} 天</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>距下一次新月</span>
              <span className={styles.statValue}>{phase.daysUntilNewMoon.toFixed(1)} 天</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>朔望月周期</span>
              <span className={styles.statValue}>{SYNODIC_MONTH.toFixed(6)} 天</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>相位角</span>
              <span className={styles.statValue}>{((phase.phaseAngle * 180) / Math.PI).toFixed(1)}°</span>
            </div>
          </div>
        </div>
      </Card>

      <Card size="small" title="邻近朔望推算">
        <div className={styles.phaseList}>
          {phaseRows.map((row) => (
            <div key={row.key} className={styles.phaseCard}>
              <span className={styles.phaseCardTitle}>{row.name}</span>
              <span className={styles.phaseCardDate}>{formatUTCDate(row.date)}</span>
              {typeof row.delta === 'number' && (
                <span className={styles.phaseCardDelta}>
                  {row.key === 'last-new' ? '已过' : '还有'} {row.delta.toFixed(1)} 天
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Alert type="info" showIcon message="算法说明" description={MODEL_NOTE} />

      <Card size="small" title="八相位月龄分档速查">
        <Table
          size="small"
          pagination={false}
          rowKey="phase"
          dataSource={[
            { phase: '新月 New', range: '0 – 1.85 天' },
            { phase: '蛾眉月 Waxing Crescent', range: '1.85 – 5.54 天' },
            { phase: '上弦月 First Quarter', range: '5.54 – 9.23 天' },
            { phase: '盈凸月 Waxing Gibbous', range: '9.23 – 12.92 天' },
            { phase: '满月 Full', range: '12.92 – 16.61 天' },
            { phase: '亏凸月 Waning Gibbous', range: '16.61 – 20.30 天' },
            { phase: '下弦月 Last Quarter', range: '20.30 – 23.99 天' },
            { phase: '残月 Waning Crescent', range: '23.99 – 27.68 天' },
          ]}
          columns={[
            { title: '相位', dataIndex: 'phase', key: 'phase' },
            { title: '月龄区间', dataIndex: 'range', key: 'range' },
          ]}
        />
      </Card>

      <Space>
        <Statistic title="当前查询日期（UTC）" value={formatUTCDate(utcDate)} />
      </Space>
    </div>
  );
};

export default MoonPhaseCalculator;
