'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Radio, Space, Statistic, Table, Tag } from 'antd';
import {
  BMI_PRESETS,
  DEFAULT_HEIGHT_CM,
  DEFAULT_WEIGHT_KG,
  HEIGHT_STEP_CM,
  WEIGHT_STEP_KG,
} from './constants';
import { evaluateBmi, imperialHeightToCm, poundsToKg, type BmiGrade } from './utils/bmi';
import styles from './index.module.css';

type UnitMode = 'metric' | 'imperial';

/** 双标准阈值对照表行 */
interface ThresholdRow {
  key: string;
  bmi: string;
  china: BmiGrade;
  who: BmiGrade;
}

const THRESHOLD_COLUMNS = [
  {
    title: 'BMI 区间（kg/m²）',
    dataIndex: 'bmi',
    key: 'bmi',
    render: (value: string) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: '中国标准',
    key: 'china',
    render: (_: unknown, record: ThresholdRow) => (
      <Tag color={record.china.color}>{record.china.label}</Tag>
    ),
  },
  {
    title: 'WHO 标准',
    key: 'who',
    render: (_: unknown, record: ThresholdRow) => (
      <Tag color={record.who.color}>{record.who.label}</Tag>
    ),
  },
];

const GRADE_COLUMNS = [
  { title: '标准', dataIndex: 'standard', key: 'standard', width: 140 },
  {
    title: '分级',
    key: 'grade',
    render: (_: unknown, record: { grade: BmiGrade }) => (
      <Tag color={record.grade.color}>{record.grade.label}</Tag>
    ),
  },
  {
    title: '分级区间（BMI）',
    key: 'range',
    render: (_: unknown, record: { grade: BmiGrade }) => (
      <span className={styles.mono}>{record.grade.rangeText}</span>
    ),
  },
];

/**
 * BMI 身体质量指数计算器（中国 / WHO 双标准）
 *
 * @returns BMI 计算交互界面
 */
const BmiCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<UnitMode>('metric');
  const [heightCm, setHeightCm] = React.useState<number>(DEFAULT_HEIGHT_CM);
  const [weightKg, setWeightKg] = React.useState<number>(DEFAULT_WEIGHT_KG);
  const [feet, setFeet] = React.useState<number | null>(5);
  const [inches, setInches] = React.useState<number | null>(7);
  const [pounds, setPounds] = React.useState<number | null>(143);

  const outcome = React.useMemo(() => {
    try {
      if (mode === 'metric') {
        return { result: evaluateBmi(heightCm, weightKg), error: undefined as string | undefined };
      }
      if (feet === null || inches === null || pounds === null) {
        return { result: undefined, error: '请完整填写英尺、英寸与磅数' };
      }
      const cm = imperialHeightToCm(feet, inches);
      const kg = poundsToKg(pounds);
      return { result: evaluateBmi(cm, kg), error: undefined };
    } catch (error) {
      return { result: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, heightCm, weightKg, feet, inches, pounds]);

  return (
    <div className={styles.container}>
      <Card title="BMI 身体质量指数计算器（中国 / WHO 双标准）">
        <p className={styles.hint}>
          BMI = 体重(kg) ÷ 身高(m)²。输入身高体重即时给出 BMI 值，并同时按中国卫生行业标准
          （偏瘦 &lt;18.5、正常 18.5–23.9、超重 24–27.9、肥胖 ≥28）与 WHO 国际标准
          （超重 ≥25、肥胖 ≥30）分级，附正常体重区间与调整建议。支持公制与英制，全部本地计算，不收集个人数据。
        </p>
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as UnitMode)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: '公制（cm / kg）', value: 'metric' },
            { label: '英制（ft / lb）', value: 'imperial' },
          ]}
        />

        {mode === 'metric' ? (
          <Space align="center" wrap size="middle" style={{ marginTop: 16 }}>
            <span className={styles.label}>身高（cm）</span>
            <InputNumber
              min={50}
              max={300}
              step={HEIGHT_STEP_CM}
              value={heightCm}
              onChange={(value) => setHeightCm(typeof value === 'number' ? value : 0)}
              style={{ width: 120 }}
            />
            <span className={styles.label}>体重（kg）</span>
            <InputNumber
              min={2}
              max={1000}
              step={WEIGHT_STEP_KG}
              value={weightKg}
              onChange={(value) => setWeightKg(typeof value === 'number' ? value : 0)}
              style={{ width: 120 }}
            />
          </Space>
        ) : (
          <Space align="center" wrap size="middle" style={{ marginTop: 16 }}>
            <span className={styles.label}>身高</span>
            <InputNumber
              min={0}
              max={9}
              step={1}
              addonAfter="ft"
              value={feet}
              onChange={setFeet}
              style={{ width: 110 }}
            />
            <InputNumber
              min={0}
              max={11}
              step={1}
              addonAfter="in"
              value={inches}
              onChange={setInches}
              style={{ width: 120 }}
            />
            <span className={styles.label}>体重</span>
            <InputNumber
              min={1}
              max={2000}
              step={1}
              addonAfter="lb"
              value={pounds}
              onChange={setPounds}
              style={{ width: 130 }}
            />
          </Space>
        )}

        <div className={styles.presetRow}>
          {BMI_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              size="small"
              onClick={() => {
                setMode('metric');
                setHeightCm(preset.heightCm);
                setWeightKg(preset.weightKg);
              }}
            >
              {preset.name}
            </Button>
          ))}
        </div>
        {outcome.error ? (
          <Alert style={{ marginTop: 12 }} type="warning" showIcon message={outcome.error} />
        ) : null}
      </Card>

      {!outcome.error && outcome.result ? (
        <Card title="计算结果">
          <Space size="large" wrap align="start" className={styles.statsRow}>
            <Statistic
              title="BMI（kg/m²）"
              value={outcome.result.bmi}
              precision={1}
              valueStyle={{ color: '#1677ff' }}
            />
            <Statistic title="身高" value={outcome.result.heightM} precision={2} suffix="m" />
            <Statistic title="体重" value={outcome.result.weightKg} precision={1} suffix="kg" />
          </Space>
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            size="small"
            bordered
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'china',
                label: '中国标准分级',
                children: (
                  <Space>
                    <Tag color={outcome.result.chinaGrade.color}>
                      {outcome.result.chinaGrade.label}
                    </Tag>
                    <span className={styles.mono}>{outcome.result.chinaGrade.rangeText}</span>
                  </Space>
                ),
              },
              {
                key: 'who',
                label: 'WHO 标准分级',
                children: (
                  <Space>
                    <Tag color={outcome.result.whoGrade.color}>
                      {outcome.result.whoGrade.label}
                    </Tag>
                    <span className={styles.mono}>{outcome.result.whoGrade.rangeText}</span>
                  </Space>
                ),
              },
              {
                key: 'range',
                label: '中国标准正常体重区间',
                children: (
                  <span className={styles.mono}>
                    {outcome.result.healthyRange.minKg.toFixed(1)} –{' '}
                    {outcome.result.healthyRange.maxKg.toFixed(1)} kg
                  </span>
                ),
              },
              {
                key: 'delta',
                label: '与正常区间中点差距',
                children:
                  Math.abs(outcome.result.deltaToNormalKg) < 0.05 ? (
                    <Tag color="green">已在正常区间附近</Tag>
                  ) : outcome.result.deltaToNormalKg > 0 ? (
                    <Tag color="blue">建议增重约 {outcome.result.deltaToNormalKg.toFixed(1)} kg</Tag>
                  ) : (
                    <Tag color="orange">
                      建议减重约 {Math.abs(outcome.result.deltaToNormalKg).toFixed(1)} kg
                    </Tag>
                  ),
              },
            ]}
          />
        </Card>
      ) : null}

      <Card title="两套成人标准分级阈值对照">
        <Table<ThresholdRow>
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={[
            {
              key: 'underweight',
              bmi: 'BMI < 18.5',
              china: { category: 'underweight', label: '偏瘦', color: 'blue', rangeText: '' },
              who: { category: 'underweight', label: 'Underweight', color: 'blue', rangeText: '' },
            },
            {
              key: 'normal-low',
              bmi: '18.5 ≤ BMI < 24',
              china: { category: 'normal', label: '正常', color: 'green', rangeText: '' },
              who: { category: 'normal', label: 'Normal', color: 'green', rangeText: '' },
            },
            {
              key: 'gap',
              bmi: '24 ≤ BMI < 25',
              china: { category: 'overweight', label: '超重', color: 'orange', rangeText: '' },
              who: { category: 'normal', label: 'Normal', color: 'green', rangeText: '' },
            },
            {
              key: 'overweight',
              bmi: '25 ≤ BMI < 28',
              china: { category: 'overweight', label: '超重', color: 'orange', rangeText: '' },
              who: { category: 'overweight', label: 'Overweight', color: 'orange', rangeText: '' },
            },
            {
              key: 'obese-gap',
              bmi: '28 ≤ BMI < 30',
              china: { category: 'obese', label: '肥胖', color: 'red', rangeText: '' },
              who: { category: 'overweight', label: 'Overweight', color: 'orange', rangeText: '' },
            },
            {
              key: 'obese',
              bmi: 'BMI ≥ 30',
              china: { category: 'obese', label: '肥胖', color: 'red', rangeText: '' },
              who: { category: 'obese', label: 'Obese', color: 'red', rangeText: '' },
            },
          ]}
          columns={THRESHOLD_COLUMNS}
        />
        {outcome.result ? (
          <Table
            rowKey="standard"
            size="small"
            pagination={false}
            style={{ marginTop: 12 }}
            dataSource={[
              { key: 'china', standard: '当前 BMI · 中国标准', grade: outcome.result.chinaGrade },
              { key: 'who', standard: '当前 BMI · WHO 标准', grade: outcome.result.whoGrade },
            ]}
            columns={GRADE_COLUMNS}
          />
        ) : null}
        <p className={styles.hint} style={{ margin: '12px 0 0' }}>
          BMI 不区分肌肉与脂肪，运动员、孕妇、老年人及未成年人不宜直接套用成人阈值；本工具不提供医疗诊断，
          健康管理请结合体脂率、腰围等指标咨询专业人士。
        </p>
      </Card>
    </div>
  );
};

export default BmiCalculator;
