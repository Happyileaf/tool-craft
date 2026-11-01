'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Statistic, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  evaluateInvestment,
  irr,
  npv,
  type NpvRowDetail,
} from './utils/npvIrr';
import {
  DECISION_TEXT,
  DEFAULT_CASH_FLOWS,
  DEFAULT_DISCOUNT_RATE_PERCENT,
  DEFAULT_HURDLE_RATE_PERCENT,
  DETAIL_COLUMN_TITLES,
  HINT,
  NEW_ROW_CASH_FLOW,
  NpvDecisionEnum,
} from './constants';
import styles from './index.module.css';

/** 折现明细表数据行（带 Table 需要的 key） */
interface DetailRow extends NpvRowDetail {
  key: number;
}

/** 货币格式化：人民币，保留两位小数 */
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 普通金额数字格式化：千分位，最多 4 位小数 */
const amountFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 4,
});

/**
 * 把小数利率格式化为百分比字符串（保留 2 位小数）
 *
 * @param value - 小数利率
 * @returns 百分比文本，如 13.07%
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/** 折现明细表列定义 */
const DETAIL_COLUMNS: ColumnsType<DetailRow> = [
  {
    title: DETAIL_COLUMN_TITLES.PERIOD,
    dataIndex: 't',
    key: 't',
    width: 100,
    render: (value: number) => <span className={styles.mono}>t = {value}</span>,
  },
  {
    title: DETAIL_COLUMN_TITLES.CASH_FLOW,
    dataIndex: 'cashFlow',
    key: 'cashFlow',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{amountFormatter.format(value)}</span>
    ),
  },
  {
    title: DETAIL_COLUMN_TITLES.DISCOUNT_FACTOR,
    dataIndex: 'discountFactor',
    key: 'discountFactor',
    align: 'right',
    render: (value: number) => (
      <span className={styles.mono}>{value.toFixed(4)}</span>
    ),
  },
  {
    title: DETAIL_COLUMN_TITLES.PRESENT_VALUE,
    dataIndex: 'presentValue',
    key: 'presentValue',
    align: 'right',
    render: (value: number) => (
      <span className={`${styles.mono} ${value < 0 ? styles.negative : ''}`}>
        {currencyFormatter.format(value)}
      </span>
    ),
  },
];

/**
 * NPV / IRR 投资现金流计算器，全部运算在浏览器本地完成
 *
 * @returns NPV / IRR 计算交互界面
 */
const NpvIrrCalculator: React.FC<ToolComponentProps> = () => {
  const [cashDrafts, setCashDrafts] = React.useState<(number | null)[]>(
    () => [...DEFAULT_CASH_FLOWS],
  );
  const [discountPercent, setDiscountPercent] = React.useState<number | null>(
    DEFAULT_DISCOUNT_RATE_PERCENT,
  );
  const [hurdleEnabled, setHurdleEnabled] = React.useState<boolean>(true);
  const [hurdlePercent, setHurdlePercent] = React.useState<number | null>(
    DEFAULT_HURDLE_RATE_PERCENT,
  );

  /** 草稿中的空值按 0 参与计算 */
  const cashFlows = React.useMemo<number[]>(
    () => cashDrafts.map((draft) => draft ?? 0),
    [cashDrafts],
  );

  /** 贴现率为小数；输入为空时按 0 处理 */
  const discountRate = (discountPercent ?? 0) / 100;

  const npvOutcome = React.useMemo(() => npv(cashFlows, discountRate), [cashFlows, discountRate]);

  const irrOutcome = React.useMemo(() => irr(cashFlows), [cashFlows]);

  const evaluation = React.useMemo(() => {
    if (npvOutcome.error !== null) return null;
    const irrValue = irrOutcome.error === null ? irrOutcome.irr : null;
    const hurdleValue = hurdleEnabled && hurdlePercent !== null ? hurdlePercent / 100 : null;
    return evaluateInvestment(npvOutcome.npv, irrValue, hurdleValue);
  }, [npvOutcome, irrOutcome, hurdleEnabled, hurdlePercent]);

  const detailRows = React.useMemo<DetailRow[]>(
    () =>
      npvOutcome.error === null
        ? npvOutcome.details.map((row) => ({ ...row, key: row.t }))
        : [],
    [npvOutcome],
  );

  /**
   * 修改指定期次的现金流金额
   *
   * @param index - 期次索引
   * @param value - 新金额（允许为 null / 负数）
   */
  const updateCashFlow = (index: number, value: number | null) => {
    setCashDrafts((previous) =>
      previous.map((draft, draftIndex) => (draftIndex === index ? value : draft)),
    );
  };

  /** 追加一期现金流 */
  const handleAddRow = () => {
    setCashDrafts((previous) => [...previous, NEW_ROW_CASH_FLOW]);
  };

  /**
   * 删除指定期次
   *
   * @param index - 期次索引
   */
  const handleRemoveRow = (index: number) => {
    setCashDrafts((previous) => previous.filter((_, draftIndex) => draftIndex !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">DCF</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="现金流（按期次排列，支持负数）" size="small">
        <div className={styles.rows}>
          {cashDrafts.length === 0 ? (
            <span className={styles.hint}>尚未添加任何期次，请点击下方按钮添加。</span>
          ) : (
            cashDrafts.map((draft, index) => (
              <div className={styles.cashRow} key={index}>
                <span className={styles.period}>
                  t = {index}
                  {index === 0 ? '（首期不折现）' : ''}
                </span>
                <InputNumber<number>
                  className={styles.amount}
                  size="small"
                  step={100}
                  placeholder="金额，流出为负"
                  value={draft}
                  onChange={(value) => updateCashFlow(index, value)}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveRow(index)}
                >
                  删除
                </Button>
              </div>
            ))
          )}
          <div className={styles.rowActions}>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
              添加一期
            </Button>
          </div>
        </div>
      </Card>

      <Card className={styles.card} title="参数设置" size="small">
        <div className={styles.options}>
          <span>贴现率</span>
          <span className={styles.rateField}>
            <InputNumber<number>
              className={styles.rateInput}
              size="small"
              step={0.1}
              value={discountPercent}
              onChange={setDiscountPercent}
            />
            <span className={styles.unit}>%</span>
          </span>
          <span>启用门槛收益率（hurdle rate）</span>
          <Switch checked={hurdleEnabled} onChange={setHurdleEnabled} />
          {hurdleEnabled ? (
            <span className={styles.rateField}>
              <InputNumber<number>
                className={styles.rateInput}
                size="small"
                step={0.1}
                value={hurdlePercent}
                onChange={setHurdlePercent}
              />
              <span className={styles.unit}>%</span>
            </span>
          ) : null}
        </div>
      </Card>

      {npvOutcome.error !== null ? (
        <Alert className={styles.notice} type="error" showIcon message={npvOutcome.error} />
      ) : (
        <>
          <Card className={styles.card} title="计算结果">
            <div className={styles.stats}>
              <Statistic
                title="净现值 NPV"
                value={npvOutcome.npv}
                formatter={(value) => currencyFormatter.format(Number(value))}
                valueStyle={{
                  color:
                    npvOutcome.npv > 0 ? '#3f8600' : npvOutcome.npv < 0 ? '#cf1322' : undefined,
                }}
              />
              <Statistic
                title="内部收益率 IRR"
                value={irrOutcome.error === null ? irrOutcome.irr : DECISION_TEXT.IRR_NONE}
                formatter={(value) =>
                  irrOutcome.error === null
                    ? formatPercent(Number(value))
                    : DECISION_TEXT.IRR_NONE
                }
                valueStyle={{
                  color: irrOutcome.error === null && irrOutcome.irr < 0 ? '#cf1322' : undefined,
                }}
              />
            </div>
            {irrOutcome.error !== null ? (
              <Alert
                className={styles.notice}
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message={irrOutcome.error}
              />
            ) : null}
          </Card>

          {evaluation ? (
            <Card className={styles.card} title="投资判定">
              <div className={styles.decision}>
                <Tag color={evaluation.decision === NpvDecisionEnum.INVEST ? 'green' : 'red'}>
                  {evaluation.decision === NpvDecisionEnum.INVEST
                    ? DECISION_TEXT.INVEST
                    : DECISION_TEXT.REJECT}
                </Tag>
                <span className={styles.hint}>
                  判定规则：NPV {'>'} 0
                  {hurdleEnabled ? ' 且 IRR 严格高于门槛收益率' : ''} 时值得投资。
                </span>
              </div>
              <ul className={styles.reasons}>
                {evaluation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className={styles.card} title={`各期折现明细（${detailRows.length} 期）`}>
            <Table<DetailRow>
              columns={DETAIL_COLUMNS}
              dataSource={detailRows}
              pagination={false}
              size="small"
              scroll={{ y: 360 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default NpvIrrCalculator;
