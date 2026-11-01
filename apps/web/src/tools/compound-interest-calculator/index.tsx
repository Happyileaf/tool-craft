'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, InputNumber, Radio, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  calculateCompound,
  type CompoundFrequency,
  type ContributionTiming,
  type GrowthRow,
} from './utils/compound';
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_CONTRIBUTION,
  DEFAULT_PRINCIPAL,
  DEFAULT_YEARS,
  FREQUENCY_OPTIONS,
  FREQUENCY_PERIOD_LABEL,
  HINT,
  SCHEDULE_COLUMN_TITLES,
  TIMING_OPTIONS,
} from './constants';
import styles from './index.module.css';

/** 增长明细表数据行（带 Table 需要的 key） */
interface ScheduleRow extends GrowthRow {
  key: number;
}

/** 人民币金额格式化 */
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 增长明细表列定义 */
const SCHEDULE_COLUMNS: ColumnsType<ScheduleRow> = [
  {
    title: SCHEDULE_COLUMN_TITLES.PERIOD,
    dataIndex: 'period',
    key: 'period',
    width: 90,
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: SCHEDULE_COLUMN_TITLES.START,
    dataIndex: 'startBalance',
    key: 'startBalance',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
  {
    title: SCHEDULE_COLUMN_TITLES.CONTRIBUTION,
    dataIndex: 'contribution',
    key: 'contribution',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
  {
    title: SCHEDULE_COLUMN_TITLES.INTEREST,
    dataIndex: 'interest',
    key: 'interest',
    align: 'right',
    render: (value: number) => (
      <span className={`${styles.mono} ${value < 0 ? styles.negative : ''}`}>
        {currencyFormatter.format(value)}
      </span>
    ),
  },
  {
    title: SCHEDULE_COLUMN_TITLES.END,
    dataIndex: 'endBalance',
    key: 'endBalance',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
];

/**
 * 复利与定投收益计算器，全部运算在浏览器本地完成
 *
 * @returns 复利终值计算交互界面
 */
const CompoundInterestCalculator: React.FC<ToolComponentProps> = () => {
  const [principal, setPrincipal] = React.useState<number | null>(DEFAULT_PRINCIPAL);
  const [annualRatePercent, setAnnualRatePercent] = React.useState<number | null>(
    DEFAULT_ANNUAL_RATE_PERCENT,
  );
  const [years, setYears] = React.useState<number | null>(DEFAULT_YEARS);
  const [frequency, setFrequency] = React.useState<CompoundFrequency>('yearly');
  const [contribution, setContribution] = React.useState<number | null>(DEFAULT_CONTRIBUTION);
  const [timing, setTiming] = React.useState<ContributionTiming>('end');

  const result = React.useMemo(
    () =>
      calculateCompound({
        principal: principal ?? 0,
        annualRatePercent: annualRatePercent ?? 0,
        years: years ?? 0,
        frequency,
        contribution: contribution ?? 0,
        timing,
      }),
    [principal, annualRatePercent, years, frequency, contribution, timing],
  );

  const rows = React.useMemo<ScheduleRow[]>(
    () => (result.error === null ? result.schedule.map((row) => ({ ...row, key: row.period })) : []),
    [result],
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">复利 / 定投</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="投资参数" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>初始本金</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              step={1000}
              value={principal}
              onChange={setPrincipal}
            />
            <span className={styles.unit}>元</span>
          </span>
          <span className={styles.option}>
            <span className={styles.label}>年化收益率</span>
            <InputNumber<number>
              className={styles.rateInput}
              size="small"
              step={0.1}
              value={annualRatePercent}
              onChange={setAnnualRatePercent}
            />
            <span className={styles.unit}>%</span>
          </span>
          <span className={styles.option}>
            <span className={styles.label}>投资期限</span>
            <InputNumber<number>
              className={styles.rateInput}
              size="small"
              min={0.1}
              step={1}
              value={years}
              onChange={setYears}
            />
            <span className={styles.unit}>年</span>
          </span>
          <span className={styles.option}>
            <span className={styles.label}>复利频率</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as CompoundFrequency)}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>{FREQUENCY_PERIOD_LABEL[frequency]}定投</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              step={100}
              value={contribution}
              onChange={setContribution}
            />
            <span className={styles.unit}>元</span>
          </span>
          <span className={styles.option}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={TIMING_OPTIONS}
              value={timing}
              onChange={(event) => setTiming(event.target.value as ContributionTiming)}
            />
          </span>
        </div>
      </Card>

      {result.error !== null ? (
        <Alert className={styles.notice} type="error" showIcon message={result.error} />
      ) : (
        <>
          <Card className={styles.card} title={`计算结果（共 ${result.periods} 期）`}>
            <div className={styles.stats}>
              <Statistic
                title="期末本息总额"
                value={result.futureValue}
                formatter={(value) => currencyFormatter.format(Number(value))}
                valueStyle={{ color: '#1677ff' }}
              />
              <Statistic
                title="累计投入本金"
                value={result.totalContributed}
                formatter={(value) => currencyFormatter.format(Number(value))}
              />
              <Statistic
                title="累计收益（复利）"
                value={result.totalInterest}
                formatter={(value) => currencyFormatter.format(Number(value))}
                valueStyle={{ color: result.totalInterest >= 0 ? '#3f8600' : '#cf1322' }}
              />
              <Statistic
                title="同等条件单利终值"
                value={result.simpleFutureValue}
                formatter={(value) => currencyFormatter.format(Number(value))}
              />
            </div>
            <Alert
              className={styles.notice}
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message={
                result.compoundAdvantage >= 0
                  ? `复利口径累计收益 ${currencyFormatter.format(result.totalInterest)}，单利口径 ${currencyFormatter.format(result.simpleInterest)}，复利效应多创造 ${currencyFormatter.format(result.compoundAdvantage)}。`
                  : `负利率下复利终值低于单利，差额 ${currencyFormatter.format(Math.abs(result.compoundAdvantage))}。`
              }
            />
          </Card>

          <Card className={styles.card} title={`逐期增长明细（${rows.length} 期）`}>
            <Table<ScheduleRow>
              columns={SCHEDULE_COLUMNS}
              dataSource={rows}
              pagination={{ pageSize: 12, showSizeChanger: false, size: 'small' }}
              size="small"
              scroll={{ y: 420 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default CompoundInterestCalculator;
