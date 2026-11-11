'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Descriptions,
  InputNumber,
  Radio,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  aprToEar,
  earToApr,
  effectiveCostRate,
  formatPercent,
  PERIOD_LABELS,
  rateSpread,
  type CompoundingPeriod,
} from './utils/rate';
import {
  DEFAULT_APR,
  DEFAULT_FEE,
  DEFAULT_PERIOD,
  DEFAULT_PRINCIPAL,
  MAX_PLANS,
} from './constants';
import styles from './index.module.css';

/** 单个对比方案的表单状态 */
interface PlanForm {
  name: string;
  principal: number;
  fee: number;
  apr: number;
  period: CompoundingPeriod;
}

/** 对比方案计算结果 */
interface PlanResult extends PlanForm {
  ear: number;
  effectiveCost: number;
  error: string | null;
}

const PERIOD_OPTIONS = (Object.keys(PERIOD_LABELS) as CompoundingPeriod[]).map(
  (value) => ({ label: PERIOD_LABELS[value], value }),
);

/**
 * APR 实际年利率计算器：名义年利率与 EAR/APY 双向换算（离散与连续复利），
 * 并把一次性开户/手续费摊入贷款真实年化成本，支持最多三个方案并排对比。
 * 全部基于 Math.pow/log/exp 的本地纯函数运算，无网络请求。
 *
 * @returns APR/EAR 换算与贷款成本对比界面
 */
const AprEarCalculator: React.FC<ToolComponentProps> = () => {
  const [apr, setApr] = React.useState<number>(DEFAULT_APR);
  const [period, setPeriod] = React.useState<CompoundingPeriod>(DEFAULT_PERIOD);

  const [earInput, setEarInput] = React.useState<number | null>(
    Number(aprToEar(DEFAULT_APR, DEFAULT_PERIOD).toFixed(4)),
  );
  const [reversePeriod, setReversePeriod] =
    React.useState<CompoundingPeriod>(DEFAULT_PERIOD);

  const [principal, setPrincipal] = React.useState<number>(DEFAULT_PRINCIPAL);
  const [fee, setFee] = React.useState<number>(DEFAULT_FEE);
  const [loanApr, setLoanApr] = React.useState<number>(DEFAULT_APR);
  const [loanPeriod, setLoanPeriod] = React.useState<CompoundingPeriod>(DEFAULT_PERIOD);

  const forward = React.useMemo(() => {
    try {
      const ear = aprToEar(apr, period);
      return { ear, spread: rateSpread(apr, ear), error: null as string | null };
    } catch (caught) {
      return { ear: null, spread: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [apr, period]);

  const reverse = React.useMemo(() => {
    if (earInput === null) {
      return { apr: null, error: null as string | null };
    }
    try {
      return { apr: earToApr(earInput, reversePeriod), error: null as string | null };
    } catch (caught) {
      return { apr: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [earInput, reversePeriod]);

  const loanCost = React.useMemo(() => {
    try {
      const effective = effectiveCostRate(principal, fee, loanApr, loanPeriod);
      const plainEar = aprToEar(loanApr, loanPeriod);
      return { effective, plainEar, error: null as string | null };
    } catch (caught) {
      return {
        effective: null,
        plainEar: null,
        error: caught instanceof Error ? caught.message : '计算失败',
      };
    }
  }, [principal, fee, loanApr, loanPeriod]);

  const [plans, setPlans] = React.useState<PlanForm[]>([
    { name: '方案 A', principal: 10000, fee: 200, apr: 12, period: 'monthly' },
    { name: '方案 B', principal: 10000, fee: 500, apr: 11.5, period: 'quarterly' },
    { name: '方案 C', principal: 10000, fee: 0, apr: 13, period: 'continuous' },
  ]);

  const planResults = React.useMemo<PlanResult[]>(
    () =>
      plans.map((plan) => {
        try {
          const ear = aprToEar(plan.apr, plan.period);
          const effectiveCost = effectiveCostRate(
            plan.principal,
            plan.fee,
            plan.apr,
            plan.period,
          );
          return { ...plan, ear, effectiveCost, error: null };
        } catch (caught) {
          return {
            ...plan,
            ear: Number.NaN,
            effectiveCost: Number.NaN,
            error: caught instanceof Error ? caught.message : '计算失败',
          };
        }
      }),
    [plans],
  );

  const validCosts = planResults.filter((p) => p.error === null);
  const minCost = validCosts.length
    ? Math.min(...validCosts.map((p) => p.effectiveCost))
    : null;
  const maxCost = validCosts.length
    ? Math.max(...validCosts.map((p) => p.effectiveCost))
    : null;

  const updatePlan = (index: number, patch: Partial<PlanForm>) => {
    setPlans((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const columns = [
    { title: '方案', dataIndex: 'name', key: 'name' },
    {
      title: '本金',
      dataIndex: 'principal',
      key: 'principal',
      render: (v: number, _row: PlanResult, index: number) => (
        <InputNumber
          className={styles.numberInput}
          min={1}
          precision={0}
          value={v}
          onChange={(value) => updatePlan(index, { principal: value ?? 0 })}
        />
      ),
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      render: (v: number, _row: PlanResult, index: number) => (
        <InputNumber
          className={styles.numberInput}
          min={0}
          precision={0}
          value={v}
          onChange={(value) => updatePlan(index, { fee: value ?? 0 })}
        />
      ),
    },
    {
      title: '名义 APR',
      dataIndex: 'apr',
      key: 'apr',
      render: (v: number, _row: PlanResult, index: number) => (
        <InputNumber
          className={styles.numberInput}
          min={0}
          precision={4}
          addonAfter="%"
          value={v}
          onChange={(value) => updatePlan(index, { apr: value ?? 0 })}
        />
      ),
    },
    {
      title: '复利频次',
      dataIndex: 'period',
      key: 'period',
      render: (v: CompoundingPeriod, _row: PlanResult, index: number) => (
        <Radio.Group
          optionType="button"
          size="small"
          value={v}
          onChange={(event) => updatePlan(index, { period: event.target.value })}
          options={PERIOD_OPTIONS}
        />
      ),
    },
    {
      title: 'EAR（无费实际年化）',
      dataIndex: 'ear',
      key: 'ear',
      render: (v: number, row: PlanResult) =>
        row.error ? <Tag color="error">参数错误</Tag> : <span className={styles.mono}>{formatPercent(v)}</span>,
    },
    {
      title: '含费有效年化成本',
      dataIndex: 'effectiveCost',
      key: 'effectiveCost',
      render: (v: number, row: PlanResult) => {
        if (row.error) {
          return <span className={styles.hint}>{row.error}</span>;
        }
        const isBest = v === minCost;
        const isWorst = v === maxCost && minCost !== maxCost;
        return (
          <span
            className={
              isBest ? styles.highlightBest : isWorst ? styles.highlightWorst : styles.mono
            }
          >
            {formatPercent(v)}
            {isBest && <Tag color="green" style={{ marginLeft: 8 }}>最低</Tag>}
            {isWorst && <Tag color="red" style={{ marginLeft: 8 }}>最高</Tag>}
          </span>
        );
      },
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="名义年利率 APR → 实际年利率 EAR">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>名义年利率 APR：</span>
            <InputNumber
              className={styles.numberInput}
              min={0}
              precision={4}
              addonAfter="%"
              value={apr}
              onChange={(value) => setApr(value ?? 0)}
            />
            <span className={styles.label}>复利频次：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
          {forward.error ? (
            <Alert type="error" showIcon message="计算失败" description={forward.error} />
          ) : (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="实际年利率 EAR / APY">
                <span className={styles.mono}>{formatPercent(forward.ear ?? Number.NaN)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="名义与实际利差">
                <span className={styles.mono}>{formatPercent(forward.spread ?? Number.NaN)}</span>
              </Descriptions.Item>
            </Descriptions>
          )}
          <div className={styles.hint}>
            离散复利 EAR = (1 + r/n)^n − 1；连续复利 EAR = e^r − 1。复利频次越高，实际年化越高于名义利率。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="目标 EAR 反求所需名义 APR">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>目标实际年利率 EAR：</span>
            <InputNumber
              className={styles.numberInput}
              min={0}
              precision={4}
              addonAfter="%"
              value={earInput}
              onChange={(value) => setEarInput(value)}
            />
            <span className={styles.label}>复利频次：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={reversePeriod}
              onChange={(event) => setReversePeriod(event.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
          {reverse.error ? (
            <Alert type="error" showIcon message="计算失败" description={reverse.error} />
          ) : (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="所需名义年利率 APR">
                <span className={styles.mono}>
                  {reverse.apr === null ? '—' : formatPercent(reverse.apr)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          )}
          <div className={styles.hint}>
            离散复利 APR = n × ((1 + EAR)^(1/n) − 1)；连续复利 APR = ln(1 + EAR)，与正算方向严格互逆。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="含手续费贷款的真实年化成本">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>贷款本金：</span>
            <InputNumber
              className={styles.numberInput}
              min={1}
              precision={0}
              value={principal}
              onChange={(value) => setPrincipal(value ?? 0)}
            />
            <span className={styles.label}>一次性手续费：</span>
            <InputNumber
              className={styles.numberInput}
              min={0}
              precision={0}
              value={fee}
              onChange={(value) => setFee(value ?? 0)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>合同 APR：</span>
            <InputNumber
              className={styles.numberInput}
              min={0}
              precision={4}
              addonAfter="%"
              value={loanApr}
              onChange={(value) => setLoanApr(value ?? 0)}
            />
            <span className={styles.label}>复利频次：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={loanPeriod}
              onChange={(event) => setLoanPeriod(event.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
          {loanCost.error ? (
            <Alert type="error" showIcon message="计算失败" description={loanCost.error} />
          ) : (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="无手续费 EAR">
                <span className={styles.mono}>{formatPercent(loanCost.plainEar ?? Number.NaN)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="含费有效年化成本">
                <span className={styles.highlightWorst}>
                  {formatPercent(loanCost.effective ?? Number.NaN)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          )}
          <div className={styles.hint}>
            借款人净到手本金 − 手续费，却按合同本金偿还一年复利本息，因此有效年化 = 一年后总偿付 ÷
            净到手本金 − 1，必然不低于无费 EAR；手续费必须小于本金。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title={`多方案并排对比（最多 ${MAX_PLANS} 个）`}>
        <Table<PlanResult>
          rowKey="name"
          columns={columns}
          dataSource={planResults}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
        <div className={styles.hint} style={{ marginTop: 12 }}>
          绿色为含费有效年化成本最低（最优）方案，红色为最高方案；表内所有数值随输入实时重算，可直接修改各方案参数。
        </div>
      </Card>
    </div>
  );
};

export default AprEarCalculator;
