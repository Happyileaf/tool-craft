'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, InputNumber, Radio, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { calculateLoan, type PaymentRow, type RepaymentMethod } from './utils/loan';
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_MONTHS,
  DEFAULT_PRINCIPAL,
  HINT,
  METHOD_DESCRIPTIONS,
  METHOD_OPTIONS,
  SCHEDULE_COLUMN_TITLES,
} from './constants';
import styles from './index.module.css';

/** 还款计划表数据行（带 Table 需要的 key） */
interface ScheduleRow extends PaymentRow {
  key: number;
}

/** 人民币金额格式化：保留两位小数 */
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 还款计划表列定义 */
const SCHEDULE_COLUMNS: ColumnsType<ScheduleRow> = [
  {
    title: SCHEDULE_COLUMN_TITLES.MONTH,
    dataIndex: 'month',
    key: 'month',
    width: 90,
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: SCHEDULE_COLUMN_TITLES.PAYMENT,
    dataIndex: 'payment',
    key: 'payment',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
  {
    title: SCHEDULE_COLUMN_TITLES.PRINCIPAL,
    dataIndex: 'principal',
    key: 'principal',
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
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
  {
    title: SCHEDULE_COLUMN_TITLES.REMAINING,
    dataIndex: 'remaining',
    key: 'remaining',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{currencyFormatter.format(value)}</span>
    ),
  },
];

/**
 * 贷款 / 月供计算器，支持等额本息与等额本金，全部运算在浏览器本地完成
 *
 * @returns 贷款还款计算交互界面
 */
const LoanCalculator: React.FC<ToolComponentProps> = () => {
  const [principal, setPrincipal] = React.useState<number | null>(DEFAULT_PRINCIPAL);
  const [annualRatePercent, setAnnualRatePercent] = React.useState<number | null>(
    DEFAULT_ANNUAL_RATE_PERCENT,
  );
  const [months, setMonths] = React.useState<number | null>(DEFAULT_MONTHS);
  const [method, setMethod] = React.useState<RepaymentMethod>('equal-payment');

  /** 空值按 0 传入，由纯函数统一校验并给出错误提示 */
  const result = React.useMemo(
    () =>
      calculateLoan(
        principal ?? 0,
        annualRatePercent ?? 0,
        Math.round(months ?? 0),
        method,
      ),
    [principal, annualRatePercent, months, method],
  );

  const rows = React.useMemo<ScheduleRow[]>(
    () => (result.error === null ? result.schedule.map((row) => ({ ...row, key: row.month })) : []),
    [result],
  );

  /** 等额本金时月供逐月递减，展示首月 / 末月区间 */
  const monthlyStatisticTitle =
    method === 'equal-payment' ? '每月还款额' : '首月还款额（逐月递减）';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">贷款计算</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="贷款参数" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>贷款本金</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0}
              step={10000}
              value={principal}
              onChange={setPrincipal}
            />
            <span className={styles.unit}>元</span>
          </span>
          <span className={styles.option}>
            <span className={styles.label}>年利率</span>
            <InputNumber<number>
              className={styles.rateInput}
              size="small"
              min={0}
              step={0.05}
              value={annualRatePercent}
              onChange={setAnnualRatePercent}
            />
            <span className={styles.unit}>%</span>
          </span>
          <span className={styles.option}>
            <span className={styles.label}>贷款期限</span>
            <InputNumber<number>
              className={styles.rateInput}
              size="small"
              min={1}
              step={12}
              value={months}
              onChange={setMonths}
            />
            <span className={styles.unit}>个月</span>
          </span>
          <span className={styles.option}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={METHOD_OPTIONS}
              value={method}
              onChange={(event) => setMethod(event.target.value as RepaymentMethod)}
            />
          </span>
        </div>
        <Alert
          className={styles.notice}
          style={{ marginTop: 12 }}
          type="info"
          showIcon
          message={METHOD_DESCRIPTIONS[method]}
        />
      </Card>

      {result.error !== null ? (
        <Alert className={styles.notice} type="error" showIcon message={result.error} />
      ) : (
        <>
          <Card className={styles.card} title="计算结果">
            <div className={styles.stats}>
              <Statistic
                title={monthlyStatisticTitle}
                value={result.monthlyPayment}
                formatter={(value) => currencyFormatter.format(Number(value))}
                valueStyle={{ color: '#1677ff' }}
              />
              <Statistic
                title="利息总额"
                value={result.totalInterest}
                formatter={(value) => currencyFormatter.format(Number(value))}
                valueStyle={{ color: '#cf1322' }}
              />
              <Statistic
                title="还款总额"
                value={result.totalPayment}
                formatter={(value) => currencyFormatter.format(Number(value))}
              />
            </div>
            {method === 'equal-principal' && rows.length > 0 ? (
              <Alert
                className={styles.notice}
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message={
                  rows.length > 1
                    ? `末月还款 ${currencyFormatter.format((rows.at(-1) as ScheduleRow).payment)}，每月递减 ${currencyFormatter.format((rows[0] as ScheduleRow).payment - (rows[1] as ScheduleRow).payment)}`
                    : `仅 1 期，还款 ${currencyFormatter.format((rows[0] as ScheduleRow).payment)}`
                }
              />
            ) : null}
          </Card>

          <Card className={styles.card} title={`逐月还款计划（${rows.length} 期）`}>
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

export default LoanCalculator;
