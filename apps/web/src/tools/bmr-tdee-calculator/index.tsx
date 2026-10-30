'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  InputNumber,
  Radio,
  Row,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import {
  buildEnergyPlan,
  ACTIVITY_LEVELS,
  type ActivityKey,
  type BmrFormula,
  type BodyProfile,
  type CalorieGoal,
  type EnergyPlan,
  type Sex,
} from './utils/bmr';
import { FORMULA_OPTIONS, SAMPLE_PROFILE, SEX_OPTIONS } from './constants';
import styles from './index.module.css';

/** 将目标区间渲染为 "min – max kcal" */
function formatRange(range: CalorieGoal): string {
  return `${range.min} – ${range.max} kcal`;
}

const BmrTdeeCalculator: React.FC<ToolComponentProps> = () => {
  const [sex, setSex] = React.useState<Sex>(SAMPLE_PROFILE.sex);
  const [age, setAge] = React.useState<number | null>(SAMPLE_PROFILE.age);
  const [height, setHeight] = React.useState<number | null>(SAMPLE_PROFILE.height);
  const [weight, setWeight] = React.useState<number | null>(SAMPLE_PROFILE.weight);
  const [formula, setFormula] = React.useState<BmrFormula>('mifflin');
  const [activity, setActivity] = React.useState<ActivityKey>('moderately');

  const outcome = React.useMemo<{ plan?: EnergyPlan; error?: string }>(() => {
    if (age === null || height === null || weight === null) {
      return {};
    }
    try {
      const profile: BodyProfile = { sex, age, height, weight };
      return { plan: buildEnergyPlan(profile, formula, activity) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [sex, age, height, weight, formula, activity]);

  const handleCopy = () => {
    if (!outcome.plan) {
      message.warning('暂无可复制的结果');
      return;
    }
    const text = [
      `BMR：${Math.round(outcome.plan.bmr)} kcal/日（${FORMULA_OPTIONS.find((item) => item.value === formula)?.label}）`,
      `TDEE：${outcome.plan.maintain} kcal/日（活动系数 ×${outcome.plan.activityFactor}）`,
      `维持体重：${outcome.plan.maintain} kcal/日`,
      `减脂参考：${formatRange(outcome.plan.cut)} /日`,
      `增肌参考：${formatRange(outcome.plan.gain)} /日`,
    ].join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const goalRows = [
    { key: 'maintain', goal: '维持体重', range: `${outcome.plan?.maintain ?? '-'} kcal/日` },
    { key: 'cut', goal: '减脂（TDEE 的 75%–85%）', range: outcome.plan ? formatRange(outcome.plan.cut) : '-' },
    { key: 'gain', goal: '增肌（TDEE 的 105%–115%）', range: outcome.plan ? formatRange(outcome.plan.gain) : '-' },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="BMR 基础代谢与 TDEE 每日热量消耗计算器"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          输入性别、年龄、身高、体重，先算基础代谢率 BMR，再按活动水平计算每日总消耗
          TDEE，并给出维持 / 减脂 / 增肌的参考热量。所有计算均在浏览器本地完成。
        </p>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className={styles.fieldLabel}>性别</div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={sex}
              options={SEX_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(e) => setSex(e.target.value as Sex)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className={styles.fieldLabel}>年龄（岁）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={120}
              precision={0}
              value={age}
              onChange={(value) => setAge(value === null ? null : Number(value))}
              placeholder="如 30"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className={styles.fieldLabel}>身高（cm）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={50}
              max={250}
              precision={1}
              value={height}
              onChange={(value) => setHeight(value === null ? null : Number(value))}
              placeholder="如 180"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className={styles.fieldLabel}>体重（kg）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={20}
              max={500}
              precision={1}
              value={weight}
              onChange={(value) => setWeight(value === null ? null : Number(value))}
              placeholder="如 80"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={10}>
            <div className={styles.fieldLabel}>BMR 公式</div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={formula}
              options={FORMULA_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(e) => setFormula(e.target.value as BmrFormula)}
            />
          </Col>
          <Col xs={24} md={14}>
            <div className={styles.fieldLabel}>活动水平</div>
            <Radio.Group
              size="small"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityKey)}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <Radio.Button key={level.key} value={level.key}>
                  ×{level.factor}
                </Radio.Button>
              ))}
            </Radio.Group>
            <div className={styles.levelHint}>
              {ACTIVITY_LEVELS.find((level) => level.key === activity)?.label}：
              {ACTIVITY_LEVELS.find((level) => level.key === activity)?.description}
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 8 }}>
          <Tag color="blue">{FORMULA_OPTIONS.find((item) => item.value === formula)?.label}</Tag>
          <span className={styles.hint}>{FORMULA_OPTIONS.find((item) => item.value === formula)?.hint}</span>
        </div>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={outcome.error} />
        ) : null}

        {outcome.plan ? (
          <div style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Card className={styles.statCard}>
                  <Statistic
                    title="基础代谢 BMR"
                    value={Math.round(outcome.plan.bmr)}
                    suffix="kcal/日"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className={styles.statCard}>
                  <Statistic
                    title={`每日总消耗 TDEE（×${outcome.plan.activityFactor}）`}
                    value={outcome.plan.maintain}
                    suffix="kcal/日"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className={styles.statCard}>
                  <Statistic title="维持体重热量" value={outcome.plan.maintain} suffix="kcal/日" />
                </Card>
              </Col>
            </Row>

            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              columns={[
                { title: '热量目标', dataIndex: 'goal', key: 'goal' },
                {
                  title: '参考每日摄入',
                  dataIndex: 'range',
                  key: 'range',
                  render: (text: string) => <span className={styles.mono}>{text}</span>,
                },
              ]}
              dataSource={goalRows}
            />

            <Descriptions
              style={{ marginTop: 16 }}
              size="small"
              bordered
              column={1}
              items={[
                { key: 'formula', label: 'BMR 公式', children: <span className={styles.mono}>{outcome.plan.bmrFormulaText}</span> },
                {
                  key: 'note',
                  label: '说明',
                  children: '结果为基于人群统计公式的估算值，个体差异（肌肉量、激素、疾病等）会影响真实代谢；区间仅供饮食规划参考。',
                },
              ]}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default BmrTdeeCalculator;
