'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Radio, Space, Table, Tag, message } from 'antd';
import {
  navyBodyFat,
  bmiBodyFat,
  classifyWhr,
  ACE_CATEGORIES,
  type BodyFatResult,
  type BodyMeasurements,
  type Sex,
  type UnitSystem,
} from './utils/bodyFat';
import {
  SEX_OPTIONS,
  UNIT_OPTIONS,
  METHOD_OPTIONS,
  ACE_TAG_COLOR,
  ACE_TAG_LABEL,
  DEFAULT_INPUTS,
  type CalcMethod,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type CalcOutcome =
  | { kind: 'ok'; data: BodyFatResult }
  | { kind: 'error'; errorMessage: string };

const BodyFatCalculator: React.FC<ToolComponentProps> = () => {
  const [sex, setSex] = React.useState<Sex>(DEFAULT_INPUTS.sex);
  const [unitSystem, setUnitSystem] = React.useState<UnitSystem>(DEFAULT_INPUTS.unitSystem);
  const [method, setMethod] = React.useState<CalcMethod>(DEFAULT_INPUTS.method);
  const [age, setAge] = React.useState<number | null>(DEFAULT_INPUTS.age);
  const [height, setHeight] = React.useState<number | null>(DEFAULT_INPUTS.height);
  const [weight, setWeight] = React.useState<number | null>(DEFAULT_INPUTS.weight);
  const [neck, setNeck] = React.useState<number | null>(DEFAULT_INPUTS.neck);
  const [waist, setWaist] = React.useState<number | null>(DEFAULT_INPUTS.waist);
  const [hip, setHip] = React.useState<number | null>(DEFAULT_INPUTS.hip);

  const unitMeta = UNIT_OPTIONS.find((option) => option.value === unitSystem) ?? UNIT_OPTIONS[0]!;
  const needNavy = method === 'navy' || method === 'both';
  const needBmi = method === 'bmi' || method === 'both';

  const measurements: BodyMeasurements | undefined = React.useMemo(() => {
    if (height === null || weight === null) return undefined;
    return {
      sex,
      age: age ?? 0,
      height,
      weight,
      neck: neck === null ? undefined : neck,
      waist: waist === null ? undefined : waist,
      hip: hip === null ? undefined : hip,
      unitSystem,
    };
  }, [sex, age, height, weight, neck, waist, hip, unitSystem]);

  const navyOutcome = React.useMemo<CalcOutcome | undefined>(() => {
    if (!needNavy || !measurements) return undefined;
    try {
      return { kind: 'ok', data: navyBodyFat(measurements) };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [needNavy, measurements]);

  const bmiOutcome = React.useMemo<CalcOutcome | undefined>(() => {
    if (!needBmi || !measurements) return undefined;
    try {
      return { kind: 'ok', data: bmiBodyFat(measurements) };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [needBmi, measurements]);

  const handleCopy = () => {
    const lines: string[] = [
      `体脂率估算（${sex === 'male' ? '男性' : '女性'}，${unitMeta.label}）`,
      `身高 ${height ?? '—'} ${unitMeta.lengthUnit}，体重 ${weight ?? '—'} ${unitMeta.weightUnit}，年龄 ${age ?? '—'}`,
    ];
    if (navyOutcome?.kind === 'ok') {
      const r = navyOutcome.data;
      lines.push(
        `[围度法] 体脂率 ${r.bodyFatPercent}%，脂肪 ${r.fatMassKg} kg，瘦体重 ${r.leanMassKg} kg，BMI ${r.bmi}${
          r.whr !== undefined ? `，WHR ${r.whr}` : ''
        }，分级 ${ACE_TAG_LABEL[r.aceCategory]}`,
      );
    }
    if (bmiOutcome?.kind === 'ok') {
      const r = bmiOutcome.data;
      lines.push(
        `[BMI 法] 体脂率 ${r.bodyFatPercent}%，脂肪 ${r.fatMassKg} kg，瘦体重 ${r.leanMassKg} kg，BMI ${r.bmi}，分级 ${ACE_TAG_LABEL[r.aceCategory]}`,
      );
    }
    if (lines.length <= 2) {
      message.warning('暂无可复制的有效结果');
      return;
    }
    copyToClipboard(lines.join('\n'));
    message.success('估算结果已复制');
  };

  const renderMetrics = (result: BodyFatResult) => [
    { label: '体脂率', value: `${result.bodyFatPercent}%` },
    { label: '脂肪重量', value: `${result.fatMassKg} kg` },
    { label: '瘦体重', value: `${result.leanMassKg} kg` },
    { label: 'BMI', value: `${result.bmi}` },
  ];

  const aceRows = ACE_CATEGORIES[sex].map((category) => ({
    key: category.key,
    name: (
      <Space>
        <Tag color={ACE_TAG_COLOR[category.key]}>{category.label}</Tag>
      </Space>
    ),
    range:
      category.range[1] === null
        ? `≥ ${category.range[0]}%`
        : `${category.range[0]}% – ${category.range[1]}%`,
  }));

  const renderOutcome = (title: string, outcome: CalcOutcome | undefined, note?: string) => {
    if (!outcome) return null;
    return (
      <div className={styles.compareCard}>
        <div className={styles.compareTitle}>{title}</div>
        {outcome.kind === 'error' ? (
          <Alert type="warning" showIcon message={outcome.errorMessage} />
        ) : (
          <>
            <div className={styles.metricGrid}>
              {renderMetrics(outcome.data).map((metric) => (
                <div key={metric.label} className={styles.metric}>
                  <div className={styles.metricLabel}>{metric.label}</div>
                  <div className={styles.metricValue}>{metric.value}</div>
                </div>
              ))}
            </div>
            <Space wrap style={{ marginTop: 12 }}>
              <span className={styles.hint}>ACE 分级：</span>
              <Tag color={ACE_TAG_COLOR[outcome.data.aceCategory]}>
                {ACE_TAG_LABEL[outcome.data.aceCategory]}
              </Tag>
              {outcome.data.whr !== undefined ? (
                <>
                  <span className={styles.hint} style={{ marginLeft: 8 }}>
                    腰臀比 WHR：
                  </span>
                  <span className={styles.mono}>{outcome.data.whr}</span>
                  <Tag color="orange">{classifyWhr(sex, outcome.data.whr)}</Tag>
                </>
              ) : null}
            </Space>
            {note ? (
              <p className={styles.hint} style={{ marginTop: 10, marginBottom: 0 }}>
                {note}
              </p>
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card
        title="体脂率估算计算器（US Navy 围度法 / BMI 推导法 + 腰臀比风险区间）"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          输入性别、身高、体重与围度数据，按 US Navy 围度公式或 Deurenberg BMI
          公式估算体脂率、脂肪 / 瘦体重，并给出 ACE 五档分级与 WHO 腰臀比风险区间。全部计算在浏览器本地完成。
        </p>

        <Space wrap size="middle" style={{ marginBottom: 12 }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={sex}
            options={SEX_OPTIONS}
            onChange={(event) => setSex(event.target.value as Sex)}
          />
          <Radio.Group
            optionType="button"
            value={unitSystem}
            options={UNIT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(event) => setUnitSystem(event.target.value as UnitSystem)}
          />
        </Space>

        <Radio.Group
          optionType="button"
          value={method}
          options={METHOD_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(event) => setMethod(event.target.value as CalcMethod)}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>
          {METHOD_OPTIONS.find((option) => option.value === method)?.hint}
        </p>

        <div className={styles.formGrid} style={{ marginTop: 8 }}>
          <div>
            <span className={styles.fieldLabel}>年龄（岁，15–100）</span>
            <InputNumber
              min={15}
              max={100}
              precision={0}
              value={age}
              onChange={(value) => setAge(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>身高（{unitMeta.lengthUnit}）</span>
            <InputNumber
              min={0}
              step={0.1}
              value={height}
              onChange={(value) => setHeight(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>体重（{unitMeta.weightUnit}）</span>
            <InputNumber
              min={0}
              step={0.1}
              value={weight}
              onChange={(value) => setWeight(value === null ? null : Number(value))}
              style={{ width: '100%' }}
            />
          </div>
          {needNavy ? (
            <>
              <div>
                <span className={styles.fieldLabel}>颈围（{unitMeta.lengthUnit}）</span>
                <InputNumber
                  min={0}
                  step={0.1}
                  value={neck}
                  onChange={(value) => setNeck(value === null ? null : Number(value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <span className={styles.fieldLabel}>腰围（{unitMeta.lengthUnit}）</span>
                <InputNumber
                  min={0}
                  step={0.1}
                  value={waist}
                  onChange={(value) => setWaist(value === null ? null : Number(value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <span className={styles.fieldLabel}>
                  臀围（{unitMeta.lengthUnit}，女性围度法必填）
                </span>
                <InputNumber
                  min={0}
                  step={0.1}
                  value={hip}
                  onChange={(value) => setHip(value === null ? null : Number(value))}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          ) : null}
        </div>

        {measurements === undefined ? (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 16 }}
            message="请填写身高与体重后查看估算结果"
          />
        ) : (
          <div className={method === 'both' ? styles.compareGrid : undefined} style={{ marginTop: 16 }}>
            {renderOutcome(
              '围度法（US Navy）',
              navyOutcome,
              sex === 'female' ? undefined : '男性公式要求腰围严格大于颈围；测量请取呼气末放松状态。',
            )}
            {renderOutcome(
              'BMI 推导法（Deurenberg）',
              bmiOutcome,
              'BMI 法对肌肉量高的运动员可能高估体脂率，建议与围度法交叉参考。',
            )}
          </div>
        )}

        {method === 'both' && navyOutcome?.kind === 'ok' && bmiOutcome?.kind === 'ok' ? (
          <p className={styles.hint} style={{ marginTop: 12 }}>
            两法差值：
            <span className={styles.mono}>
              {Math.abs(navyOutcome.data.bodyFatPercent - bmiOutcome.data.bodyFatPercent).toFixed(1)}
            </span>
            个百分点（估算方法不同，差值在 3–5 个百分点内属常见现象）。
          </p>
        ) : null}

        <Card size="small" style={{ marginTop: 16 }} title="ACE 体脂分级参考（当前性别）">
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: '分级', dataIndex: 'name', key: 'name' },
              { title: '体脂率区间', dataIndex: 'range', key: 'range' },
            ]}
            dataSource={aceRows}
          />
        </Card>

        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="结果为公式估算值，不构成医学诊断或治疗建议。体脂测量受 hydration、测量姿势等影响，如需精确评估请采用 DEXA 等专业手段。"
        />
      </Card>
    </div>
  );
};

export default BodyFatCalculator;
