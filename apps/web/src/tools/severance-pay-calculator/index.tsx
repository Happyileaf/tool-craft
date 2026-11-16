'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Radio, Space, Table, Tag, message } from 'antd';
import { calcSeverance, type SeveranceScenario, type SeveranceResult } from './utils/severance';
import { SCENARIO_OPTIONS, DEFAULT_INPUTS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type CalcOutcome =
  | { kind: 'ok'; data: SeveranceResult }
  | { kind: 'error'; errorMessage: string };

function formatYuan(value: number): string {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SeverancePayCalculator: React.FC<ToolComponentProps> = () => {
  const [years, setYears] = React.useState<number | null>(DEFAULT_INPUTS.years);
  const [months, setMonths] = React.useState<number | null>(DEFAULT_INPUTS.months);
  const [monthlyWage, setMonthlyWage] = React.useState<number | null>(DEFAULT_INPUTS.monthlyWage);
  const [localAvgWage, setLocalAvgWage] = React.useState<number | null>(DEFAULT_INPUTS.localAvgWage);
  const [scenario, setScenario] = React.useState<SeveranceScenario>(DEFAULT_INPUTS.scenario);

  const outcome = React.useMemo<CalcOutcome | undefined>(() => {
    if (years === null || months === null || monthlyWage === null) return undefined;
    try {
      return {
        kind: 'ok',
        data: calcSeverance({
          years,
          months,
          monthlyWage,
          localAvgWage: localAvgWage === null ? undefined : localAvgWage,
          scenario,
        }),
      };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [years, months, monthlyWage, localAvgWage, scenario]);

  const handleCopy = () => {
    if (outcome?.kind !== 'ok') {
      message.warning('输入无效，暂无可复制的结果');
      return;
    }
    const r = outcome.data;
    copyToClipboard(
      [
        `情形：${SCENARIO_OPTIONS.find((option) => option.value === scenario)?.label ?? scenario}`,
        ...r.breakdown,
        `应付总额：${formatYuan(r.totalPay)} 元`,
        '（估算结果，非正式法律意见）',
      ].join('\n'),
    );
    message.success('计算明细已复制');
  };

  const detailColumns = [
    { title: '项目', dataIndex: 'item', key: 'item', width: 200 },
    { title: '数值 / 说明', dataIndex: 'value', key: 'value' },
  ];

  const detailRows =
    outcome?.kind === 'ok'
      ? [
          { key: 'n', item: '补偿月数 N', value: `${outcome.data.rawMonths} 个月` },
          {
            key: 'cap',
            item: '计算基数',
            value: (
              <Space>
                <span className={styles.mono}>{formatYuan(outcome.data.baseWage)} 元 / 月</span>
                {outcome.data.wageCapped ? <Tag color="orange">三倍社平封顶</Tag> : <Tag>未封顶</Tag>}
              </Space>
            ),
          },
          {
            key: 'months',
            item: '实际计发月数',
            value: (
              <Space>
                <span className={styles.mono}>{outcome.data.effectiveMonths} 个月</span>
                {outcome.data.monthsCapped ? <Tag color="orange">12 年年限封顶</Tag> : null}
              </Space>
            ),
          },
          {
            key: 'severance',
            item: '经济补偿金 N×基数',
            value: `${formatYuan(outcome.data.severancePay)} 元`,
          },
          {
            key: 'notice',
            item: '代通知金',
            value:
              outcome.data.noticePay > 0 ? `${formatYuan(outcome.data.noticePay)} 元` : '不适用（仅 N+1 情形）',
          },
        ]
      : [];

  return (
    <div className={styles.container}>
      <Card
        title="经济补偿金与代通知金计算器（N / N+1 / 2N，含月工资上限与年限折算）"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制明细
          </Button>
        }
      >
        <p className={styles.hint}>
          依据《劳动合同法》第 40 / 47 / 87 条估算解除劳动合同的经济补偿：每满一年计一个月工资，六个月以上不满一年按一年、不满六个月按半个月；月工资超过当地社平工资三倍时基数封顶且年限最高
          12 年。全部计算在浏览器本地完成。
        </p>

        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={scenario}
          options={SCENARIO_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(event) => setScenario(event.target.value as SeveranceScenario)}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>
          {SCENARIO_OPTIONS.find((option) => option.value === scenario)?.hint}
        </p>

        <div className={styles.formGrid} style={{ marginTop: 8 }}>
          <div>
            <span className={styles.fieldLabel}>工作年数（整年）</span>
            <InputNumber
              min={0}
              precision={0}
              value={years}
              onChange={(value) => setYears(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>剩余月数（0–11）</span>
            <InputNumber
              min={0}
              max={11}
              precision={0}
              value={months}
              onChange={(value) => setMonths(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>月平均工资（元）</span>
            <InputNumber
              min={0}
              step={1000}
              value={monthlyWage}
              onChange={(value) => setMonthlyWage(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>
              当地上年度社平工资（元，可选）
            </span>
            <InputNumber
              min={0}
              step={1000}
              value={localAvgWage}
              placeholder="留空则不触发三倍封顶"
              onChange={(value) => setLocalAvgWage(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        {localAvgWage === null ? (
          <p className={styles.hint} style={{ marginTop: 8 }}>
            未提供社平工资：不会触发三倍封顶与 12 年年限封顶，按实际工资与实际年限计算。
          </p>
        ) : null}

        {outcome === undefined ? (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 16 }}
            message="请填写工龄与月工资后查看估算结果"
          />
        ) : outcome.kind === 'error' ? (
          <Alert type="warning" showIcon style={{ marginTop: 16 }} message={outcome.errorMessage} />
        ) : (
          <>
            <div className={styles.totalCard} style={{ marginTop: 16 }}>
              <div className={styles.totalLabel}>应付总额（估算）</div>
              <div className={styles.totalValue}>{formatYuan(outcome.data.totalPay)} 元</div>
            </div>

            <div className={styles.metricGrid} style={{ marginTop: 12 }}>
              {[
                { label: '补偿月数 N', value: `${outcome.data.rawMonths}` },
                { label: '计发月数', value: `${outcome.data.effectiveMonths}` },
                { label: '月计算基数', value: `${formatYuan(outcome.data.baseWage)} 元` },
                {
                  label: scenario === '2N' ? '2N 赔偿金' : '经济补偿金',
                  value: `${formatYuan(outcome.data.severancePay)} 元`,
                },
              ].map((metric) => (
                <div key={metric.label} className={styles.metric}>
                  <div className={styles.metricLabel}>{metric.label}</div>
                  <div className={styles.metricValue}>{metric.value}</div>
                </div>
              ))}
            </div>

            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              columns={detailColumns}
              dataSource={detailRows}
            />

            <Card size="small" style={{ marginTop: 16 }} title="分项计算过程">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {outcome.data.breakdown.map((line) => (
                  <li key={line} className={styles.mono} style={{ marginBottom: 4 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="估算结果，非正式法律意见。本工具未纳入 2008 年前工龄分段、地方特殊规定与个案证据因素，实际金额以劳动仲裁 / 法院认定为准。"
        />
      </Card>
    </div>
  );
};

export default SeverancePayCalculator;
