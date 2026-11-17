'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  capitalRecoveryFactor,
  fvifa,
  fvAnnuity,
  percentToRate,
  pvifa,
  pvAnnuity,
  sinkingFundFactor,
  solvePayment,
  type AnnuityType,
} from './utils/annuity';
import {
  ANNUITY_TYPE_OPTIONS,
  CALC_MODE_OPTIONS,
  GRANULARITY_OPTIONS,
  RATE_REFERENCE,
  type CalcMode,
  type PeriodGranularity,
} from './constants';
import styles from './index.module.css';

type NullableNumber = number | null;

interface FormState {
  type: AnnuityType;
  mode: CalcMode;
  granularity: PeriodGranularity;
  payment: NullableNumber;
  ratePercent: NullableNumber;
  periods: NullableNumber;
  deferralPeriods: NullableNumber;
  targetPV: NullableNumber;
  targetFV: NullableNumber;
  perpetuityDue: boolean;
}

function initialState(): FormState {
  return {
    type: 'ordinary',
    mode: 'forward',
    granularity: 'year',
    payment: 1000,
    ratePercent: 5,
    periods: 10,
    deferralPeriods: 3,
    targetPV: 8000,
    targetFV: 12000,
    perpetuityDue: false,
  };
}

/** 千分位格式化，null/非法显示占位 */
function formatMoney(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatFactor(value: number | null | undefined, digits = 6): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return String(parseFloat(value.toPrecision(8)));
}

interface Outcome {
  pv?: number;
  fv?: number | null;
  solvedPayment?: number;
  factors?: Array<{ key: string; name: string; value: string; note: string }>;
  error?: string;
}

/**
 * 年金现值 / 终值计算器（普通、预付、递延、永续）
 *
 * @returns 年金 TVM 计算交互界面
 */
const AnnuityCalculator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<FormState>(initialState);
  const patch = (key: keyof FormState, value: unknown) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const isPerpetuity = form.type === 'perpetuity';
  const isDeferred = form.type === 'deferred';

  const outcome = React.useMemo<Outcome>(() => {
    try {
      const rate = percentToRate(form.ratePercent ?? NaN);
      if (!Number.isFinite(rate) || rate <= -1) {
        return { error: '期利率必须为有限数值且大于 −100%。' };
      }
      const n = form.periods ?? NaN;
      const m = form.deferralPeriods ?? 0;

      // 永续型不需要 n；其余类型 n 必须为正整数
      if (!isPerpetuity && (!Number.isInteger(n) || n <= 0)) {
        return { error: '期数 n 必须为正整数。' };
      }
      if (isDeferred && (!Number.isInteger(m) || m < 0)) {
        return { error: '递延期 m 必须为非负整数。' };
      }
      if (isPerpetuity && rate === 0) {
        return { error: '利率为 0 时永续年金现值无定义（A/i 发散），请填写非零利率。' };
      }

      const periods = isPerpetuity ? 0 : n;
      const baseInput = {
        type: form.type,
        ratePerPeriod: rate,
        periods,
        deferralPeriods: isDeferred ? m : 0,
        perpetuityDue: isPerpetuity ? form.perpetuityDue : false,
      };

      // 系数表（永续无 n 期系数，不展示）
      const factors = isPerpetuity
        ? []
        : [
            {
              key: 'pvifa',
              name: '年金现值系数 PVIFA',
              value: formatFactor(pvifa(rate, periods)),
              note: '[1−(1+i)^−n] / i',
            },
            {
              key: 'fvifa',
              name: '年金终值系数 FVIFA',
              value: formatFactor(fvifa(rate, periods)),
              note: '[(1+i)^n−1] / i',
            },
            {
              key: 'crf',
              name: '资本回收系数',
              value: formatFactor(capitalRecoveryFactor(rate, periods)),
              note: '1 / PVIFA',
            },
            {
              key: 'sff',
              name: '偿债基金系数',
              value: formatFactor(sinkingFundFactor(rate, periods)),
              note: '1 / FVIFA',
            },
          ];

      if (form.mode === 'forward') {
        const a = form.payment ?? NaN;
        if (!(a > 0)) return { error: '每期收付额 A 必须大于 0。' };
        const pv = pvAnnuity({ ...baseInput, payment: a });
        const fv = fvAnnuity({ ...baseInput, payment: a });
        return { pv, fv, factors };
      }

      if (form.mode === 'reverse-pv') {
        const target = form.targetPV ?? NaN;
        if (!(target > 0)) return { error: '目标现值必须大于 0。' };
        const solved = solvePayment(
          form.type,
          'pv',
          target,
          rate,
          periods,
          baseInput.deferralPeriods,
          baseInput.perpetuityDue,
        );
        const verifyPV = pvAnnuity({ ...baseInput, payment: solved });
        return { solvedPayment: solved, pv: verifyPV, factors };
      }

      // reverse-fv
      if (isPerpetuity) {
        return { error: '永续年金终值无定义，不支持按目标终值反算。', factors };
      }
      const target = form.targetFV ?? NaN;
      if (!(target > 0)) return { error: '目标终值必须大于 0。' };
      const solved = solvePayment(form.type, 'fv', target, rate, periods, baseInput.deferralPeriods);
      const verifyFV = fvAnnuity({ ...baseInput, payment: solved });
      return { solvedPayment: solved, fv: verifyFV, factors };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [form, isPerpetuity, isDeferred]);

  const reset = () => setForm(initialState());

  const copyResult = () => {
    if (outcome.error) {
      message.warning('暂无可复制的结果');
      return;
    }
    const lines = [
      `类型：${ANNUITY_TYPE_OPTIONS.find((item) => item.value === form.type)?.label ?? form.type}`,
      `利率 i=${String(form.ratePercent)}%，期数 n=${isPerpetuity ? '∞' : String(form.periods)}`,
    ];
    if (isDeferred) lines.push(`递延期 m=${String(form.deferralPeriods)}`);
    if (outcome.solvedPayment !== undefined)
      lines.push(`反算每期收付额 A=${formatMoney(outcome.solvedPayment)}`);
    if (outcome.pv !== undefined) lines.push(`现值 PV=${formatMoney(outcome.pv)}`);
    lines.push(
      outcome.fv === null || outcome.fv === undefined
        ? '终值 FV=无定义（永续年金）'
        : `终值 FV=${formatMoney(outcome.fv)}`,
    );
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  return (
    <div className={styles.container}>
      <Card
        title="年金现值 / 终值计算器（普通 · 预付 · 递延 · 永续）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          按货币时间价值（TVM）闭式公式计算四类年金的现值 PV 与终值 FV，支持按目标 PV/FV 反算每期收付额
          A，并展示 PVIFA、FVIFA、资本回收与偿债基金系数。利率以百分数输入（3.5 表示 3.5%），全部本地计算。
        </p>

        <h4 className={styles.sectionTitle}>年金类型与计算模式</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>年金类型</div>
            <Select
              style={{ width: '100%' }}
              value={form.type}
              onChange={(value) => patch('type', value)}
              options={ANNUITY_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            />
            <p className={styles.microHint}>
              {ANNUITY_TYPE_OPTIONS.find((item) => item.value === form.type)?.hint}
            </p>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>期粒度</div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={form.granularity}
              onChange={(event) => patch('granularity', event.target.value as PeriodGranularity)}
              options={GRANULARITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            />
            <p className={styles.microHint}>
              粒度仅影响字段文案；请保证利率与期数使用同一期单位（年利率配年数、月利率配月数）。
            </p>
          </div>
        </div>

        <div className={styles.fieldCard} style={{ marginTop: 12 }}>
          <div className={styles.fieldLabel}>计算模式</div>
          <Radio.Group
            value={form.mode}
            onChange={(event) => patch('mode', event.target.value as CalcMode)}
          >
            <Space direction="vertical">
              {CALC_MODE_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                  <span className={styles.microHint}>　{option.hint}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        <h4 className={styles.sectionTitle}>参数输入</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>
              {form.mode === 'forward' ? '每期收付额 A' : '每期收付额 A（正算时使用）'}
            </div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={form.payment}
              disabled={form.mode !== 'forward'}
              onChange={(value) => patch('payment', value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>
              {GRANULARITY_OPTIONS.find((item) => item.value === form.granularity)?.rateLabel}
            </div>
            <InputNumber
              style={{ width: '100%' }}
              step={0.1}
              value={form.ratePercent}
              onChange={(value) => patch('ratePercent', value === null ? null : Number(value))}
            />
            <p className={styles.microHint}>如 3.5 表示 3.5%；须大于 −100%。</p>
          </div>

          {!isPerpetuity ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>
                {GRANULARITY_OPTIONS.find((item) => item.value === form.granularity)?.periodLabel}
              </div>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                precision={0}
                value={form.periods}
                onChange={(value) => patch('periods', value === null ? null : Number(value))}
              />
            </div>
          ) : (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>收付期数 n</div>
              <Tag color="default">永续：n → ∞，无需输入</Tag>
              <p className={styles.microHint}>永续年金没有终止时点，终值 FV 无定义。</p>
            </div>
          )}

          {isDeferred ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>递延期 m（非负整数期）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={0}
                value={form.deferralPeriods}
                onChange={(value) => patch('deferralPeriods', value === null ? null : Number(value))}
              />
              <p className={styles.microHint}>前 m 期不收付，现值在普通 PVA 基础上再折现 m 期。</p>
            </div>
          ) : null}

          {isPerpetuity ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>预付永续（期初收付）</div>
              <Space>
                <Switch
                  checked={form.perpetuityDue}
                  onChange={(checked) => patch('perpetuityDue', checked)}
                />
                <span className={styles.microHint}>
                  开启后 PV = A/i + A = A·(1+i)/i
                </span>
              </Space>
            </div>
          ) : null}

          {form.mode === 'reverse-pv' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>目标现值 PV</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={form.targetPV}
                onChange={(value) => patch('targetPV', value === null ? null : Number(value))}
              />
            </div>
          ) : null}
          {form.mode === 'reverse-fv' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>目标终值 FV</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={form.targetFV}
                onChange={(value) => patch('targetFV', value === null ? null : Number(value))}
              />
            </div>
          ) : null}
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <Button size="small" onClick={reset}>
            重置为示例
          </Button>
        </Space>

        {outcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="无法计算"
            description={outcome.error}
          />
        ) : null}

        {outcome.solvedPayment !== undefined ? (
          <Tag color="green" style={{ marginTop: 16, fontSize: 16, padding: '6px 16px' }}>
            反算每期收付额 A ≈ {formatMoney(outcome.solvedPayment)}
          </Tag>
        ) : null}

        {!outcome.error && (outcome.pv !== undefined || outcome.fv !== undefined) ? (
          <Descriptions style={{ marginTop: 16 }} size="small" bordered column={1}>
            {outcome.pv !== undefined ? (
              <Descriptions.Item label="现值 PV">
                <span className={styles.mono}>{formatMoney(outcome.pv)}</span>
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="终值 FV">
              <span className={styles.mono}>
                {outcome.fv === null || outcome.fv === undefined
                  ? '无定义（永续年金 n→∞）'
                  : formatMoney(outcome.fv)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        ) : null}

        {outcome.factors && outcome.factors.length > 0 ? (
          <>
            <h4 className={styles.sectionTitle}>系数表（i 与 n 下的标准 TVM 系数）</h4>
            <Table
              size="small"
              pagination={false}
              dataSource={outcome.factors}
              columns={[
                { title: '系数', dataIndex: 'name', key: 'name' },
                {
                  title: '数值',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value: string) => <span className={styles.mono}>{value}</span>,
                },
                { title: '公式', dataIndex: 'note', key: 'note' },
              ]}
            />
          </>
        ) : null}

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="常见年利率参考（以实际合同/挂牌为准）"
          description={
            <ul className={styles.warningList}>
              {RATE_REFERENCE.map((item) => (
                <li key={item.scene}>
                  {item.scene}：{item.range}
                </li>
              ))}
            </ul>
          }
        />
      </Card>
    </div>
  );
};

export default AnnuityCalculator;
