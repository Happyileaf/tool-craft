'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Segmented,
  Space,
  Statistic,
  Table,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  blackScholes,
  toYears,
  type BsmResult,
  type TimeUnit,
} from './utils/blackScholes';
import { EXAMPLE_PRESET, TERM_UNIT_OPTIONS } from './constants';
import styles from './index.module.css';

/** Greeks 表格行 */
interface GreekRow {
  /** 行标识 */
  key: string;
  /** 指标中文名 */
  name: string;
  /** 看涨口径数值（共用指标同样填该列） */
  call: string;
  /** 看跌口径数值（共用指标同样填该列） */
  put: string;
  /** 备注，如共用说明 */
  note: string;
}

/** 数值格式化：非有限数统一展示为占位符，绝不渲染 NaN/Infinity */
function formatNumber(value: number, digits = 6): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return value.toFixed(digits);
}

/** 平价残差格式化：极小值用科学计数法，其余保留 12 位小数 */
function formatResidual(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return Math.abs(value) < 1e-10 ? value.toExponential(6) : value.toFixed(12);
}

/** 把定价结果转换为 Greeks 表格行 */
function toGreekRows(result: BsmResult): GreekRow[] {
  const { greeks } = result;
  const sharedNote = '看涨/看跌共用';
  return [
    {
      key: 'delta',
      name: 'Delta Δ',
      call: formatNumber(greeks.deltaCall),
      put: formatNumber(greeks.deltaPut),
      note: '标的价格每变动 1 单位',
    },
    {
      key: 'gamma',
      name: 'Gamma Γ',
      call: formatNumber(greeks.gamma),
      put: formatNumber(greeks.gamma),
      note: sharedNote,
    },
    {
      key: 'vega',
      name: 'Vega（每 1% 波动率）',
      call: formatNumber(greeks.vegaPer1pct),
      put: formatNumber(greeks.vegaPer1pct),
      note: `${sharedNote}；原始 Vega ${formatNumber(greeks.vega)}`,
    },
    {
      key: 'theta',
      name: 'Theta Θ（每日历日）',
      call: formatNumber(greeks.thetaCallDaily),
      put: formatNumber(greeks.thetaPutDaily),
      note: '年化 Theta 除以 365',
    },
    {
      key: 'rho',
      name: 'Rho（每 1% 利率）',
      call: formatNumber(greeks.rhoCall),
      put: formatNumber(greeks.rhoPut),
      note: '无风险利率每变动 1 个百分点',
    },
  ];
}

const GREEK_COLUMNS: TableColumnsType<GreekRow> = [
  { title: '指标', dataIndex: 'name', key: 'name', width: 200 },
  {
    title: '看涨 Call',
    dataIndex: 'call',
    key: 'call',
    render: (text: string) => <span className={styles.mono}>{text}</span>,
  },
  {
    title: '看跌 Put',
    dataIndex: 'put',
    key: 'put',
    render: (text: string) => <span className={styles.mono}>{text}</span>,
  },
  { title: '说明', dataIndex: 'note', key: 'note' },
];

/**
 * Black-Scholes-Merton 欧式期权定价计算器：
 * 输入 S / K / r / σ / T / q，输出看涨看跌理论价格、Greeks 与买卖平价校验。
 * 利率、波动率、股息率在界面按百分数录入，内部除以 100 换算为小数；
 * 期限支持年 / 月 / 日切换，月按 1/12 年、日按 1/365 年换算。
 *
 * @returns BSM 期权定价与 Greeks 交互界面
 */
const BlackScholesCalculator: React.FC<ToolComponentProps> = () => {
  const [S, setS] = React.useState<number | null>(EXAMPLE_PRESET.S);
  const [K, setK] = React.useState<number | null>(EXAMPLE_PRESET.K);
  const [rPercent, setRPercent] = React.useState<number | null>(
    EXAMPLE_PRESET.rPercent,
  );
  const [sigmaPercent, setSigmaPercent] = React.useState<number | null>(
    EXAMPLE_PRESET.sigmaPercent,
  );
  const [term, setTerm] = React.useState<number | null>(EXAMPLE_PRESET.term);
  const [termUnit, setTermUnit] = React.useState<TimeUnit>(
    EXAMPLE_PRESET.termUnit,
  );
  const [qPercent, setQPercent] = React.useState<number | null>(
    EXAMPLE_PRESET.qPercent,
  );

  /** 当前定价结果（含错误信息），任一必填项缺失则不计算 */
  const outcome = React.useMemo<{ result?: BsmResult; error?: string }>(() => {
    if (
      S === null ||
      K === null ||
      rPercent === null ||
      sigmaPercent === null ||
      term === null
    ) {
      return {};
    }
    try {
      const result = blackScholes({
        S,
        K,
        r: rPercent / 100,
        sigma: sigmaPercent / 100,
        T: toYears(term, termUnit),
        q: (qPercent ?? 0) / 100,
      });
      return { result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [S, K, rPercent, sigmaPercent, term, termUnit, qPercent]);

  /** 一键填充教科书平值期权示例 */
  const applyExample = () => {
    setS(EXAMPLE_PRESET.S);
    setK(EXAMPLE_PRESET.K);
    setRPercent(EXAMPLE_PRESET.rPercent);
    setSigmaPercent(EXAMPLE_PRESET.sigmaPercent);
    setTerm(EXAMPLE_PRESET.term);
    setTermUnit(EXAMPLE_PRESET.termUnit);
    setQPercent(EXAMPLE_PRESET.qPercent);
  };

  return (
    <div className={styles.container}>
      <Card
        title="Black-Scholes-Merton 欧式期权定价计算器（含 Greeks）"
        extra={
          <Button size="small" type="primary" onClick={applyExample}>
            示例填充
          </Button>
        }
      >
        <p className={styles.hint}>
          利率、波动率、股息率均按百分数录入（如 5 表示 5%）；期限支持年 / 月 / 日切换（月按 1/12
          年、日按 1/365 年换算）。仅适用于欧式期权、恒定波动率与无风险利率的理论定价。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>标的现价 S</span>
            <InputNumber
              className={styles.numberInput}
              placeholder="如 100"
              min={0}
              value={S}
              onChange={(value) => setS(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>行权价 K</span>
            <InputNumber
              className={styles.numberInput}
              placeholder="如 100"
              min={0}
              value={K}
              onChange={(value) => setK(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>无风险利率 r</span>
            <InputNumber
              className={styles.numberInput}
              addonAfter="%"
              placeholder="如 5"
              min={0}
              value={rPercent}
              onChange={(value) =>
                setRPercent(value === null ? null : Number(value))
              }
            />
          </div>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>年化波动率 σ</span>
            <InputNumber
              className={styles.numberInput}
              addonAfter="%"
              placeholder="如 20"
              min={0}
              value={sigmaPercent}
              onChange={(value) =>
                setSigmaPercent(value === null ? null : Number(value))
              }
            />
          </div>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>剩余期限 T</span>
            <InputNumber
              className={styles.numberInput}
              placeholder="如 1"
              min={0}
              value={term}
              onChange={(value) => setTerm(value === null ? null : Number(value))}
            />
            <Segmented
              value={termUnit}
              onChange={(value) => setTermUnit(value as TimeUnit)}
              options={TERM_UNIT_OPTIONS}
            />
          </div>
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>连续股息率 q（默认 0）</span>
            <InputNumber
              className={styles.numberInput}
              addonAfter="%"
              placeholder="如 0"
              min={0}
              value={qPercent}
              onChange={(value) =>
                setQPercent(value === null ? null : Number(value))
              }
            />
          </div>
        </div>

        {outcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="无法计算"
            description={outcome.error}
          />
        ) : null}

        {outcome.result ? (
          <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
            <div className={styles.priceGrid}>
              <Card className={styles.priceCard}>
                <Statistic
                  title="看涨期权 Call"
                  value={outcome.result.call}
                  precision={4}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
              <Card className={styles.priceCard}>
                <Statistic
                  title="看跌期权 Put"
                  value={outcome.result.put}
                  precision={4}
                  valueStyle={{ color: '#389e0d' }}
                />
              </Card>
            </div>

            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="d1">
                <span className={styles.mono}>{formatNumber(outcome.result.d1)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="d2">
                <span className={styles.mono}>{formatNumber(outcome.result.d2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="期限 T（年）">
                <span className={styles.mono}>
                  {formatNumber(toYears(term ?? 0, termUnit))}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Table<GreekRow>
              size="small"
              pagination={false}
              rowKey="key"
              columns={GREEK_COLUMNS}
              dataSource={toGreekRows(outcome.result)}
            />

            <Alert
              type="info"
              showIcon
              message="买卖平价校验（Put-Call Parity）"
              description={
                <div className={styles.parity}>
                  理论关系：C − P = S·e^(−qT) − K·e^(−rT)，残差：
                  <span className={styles.mono}>
                    {' '}
                    {formatResidual(outcome.result.parityResidual)}
                  </span>
                  （绝对值应接近 0）
                </div>
              }
            />
          </Space>
        ) : null}
      </Card>
    </div>
  );
};

export default BlackScholesCalculator;
