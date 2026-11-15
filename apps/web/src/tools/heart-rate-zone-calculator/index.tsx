'use client';

import { Alert, Button, Card, Input, InputNumber, Radio, Select, Space, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { calculateHeartRateZones } from './utils/heart-rate';
import type { HeartRateResult, MaxHrFormula, Sex } from './utils/heart-rate';
import styles from './index.module.css';

const FORMULA_OPTIONS: { label: string; value: MaxHrFormula }[] = [
  { label: '自动（未填实测值时用 Tanaka）', value: 'auto' },
  { label: 'Fox：220 − 年龄', value: 'fox' },
  { label: 'Tanaka：208 − 0.7 × 年龄', value: 'tanaka' },
  { label: 'Gulati（女性）：206 − 0.88 × 年龄', value: 'gulati' },
];

const FORMULA_LABELS: Record<HeartRateResult['formulaUsed'], string> = {
  measured: '实测最大心率',
  fox: 'Fox 公式',
  tanaka: 'Tanaka 公式',
  gulati: 'Gulati 公式',
};

const ZONE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171'];

type CalcResult = { ok: true; data: HeartRateResult } | { ok: false; error: string };

export default function HeartRateZoneCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [age, setAge] = useState(30);
  const [restingHr, setRestingHr] = useState(60);
  const [sex, setSex] = useState<Sex>('male');
  const [formula, setFormula] = useState<MaxHrFormula>('auto');
  const [measuredInput, setMeasuredInput] = useState(defaultInput ?? '');

  const measuredMaxHr = useMemo(() => {
    const trimmed = measuredInput.trim();
    if (trimmed === '') {
      return null;
    }
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : Number.NaN;
  }, [measuredInput]);

  const result = useMemo<CalcResult>(() => {
    try {
      return { ok: true, data: calculateHeartRateZones({ age, restingHr, sex, formula, measuredMaxHr }) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [age, restingHr, sex, formula, measuredMaxHr]);

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const data = result.data;
    const lines = [
      `最大心率：${data.maxHr} bpm（${FORMULA_LABELS[data.formulaUsed]}）`,
      `储备心率：${data.heartRateReserve} bpm`,
      ...data.zones.map(
        (zone) =>
          `${zone.name}（${zone.lowerPercent}–${zone.upperPercent}% HRR）：${zone.lowerBpm}–${zone.upperBpm} bpm`,
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制区间');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="个人信息">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>年龄</span>
            <InputNumber
              min={10}
              max={100}
              value={age}
              onChange={(value) => setAge(value ?? 30)}
              style={{ width: 120 }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>静息心率（bpm）</span>
            <InputNumber
              min={30}
              max={120}
              value={restingHr}
              onChange={(value) => setRestingHr(value ?? 60)}
              style={{ width: 150 }}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>实测最大心率（可选）</span>
            <Input
              value={measuredInput}
              onChange={(event) => setMeasuredInput(event.target.value)}
              placeholder="如 185，留空则按公式估算"
              allowClear
              style={{ width: 220 }}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>性别</span>
            <Radio.Group
              value={sex}
              onChange={(event) => setSex(event.target.value as Sex)}
              options={[
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
              ]}
            />
          </div>
          <label className={styles.field}>
            <span className={styles.label}>最大心率公式</span>
            <Select
              value={formula}
              onChange={setFormula}
              options={FORMULA_OPTIONS}
              style={{ width: 280 }}
            />
          </label>
        </div>

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.label}>估算最大心率</span>
                <span className={styles.value}>{result.data.maxHr} bpm</span>
                <span className={styles.sub}>{FORMULA_LABELS[result.data.formulaUsed]}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>储备心率（HRR）</span>
                <span className={styles.value}>{result.data.heartRateReserve} bpm</span>
                <span className={styles.sub}>HRmax − 静息心率</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>计算方式</span>
                <span className={styles.value}>Karvonen</span>
                <span className={styles.sub}>静息心率 + 百分比 × HRR</span>
              </div>
            </div>

            <div className={styles.zones}>
              {result.data.zones.map((zone) => (
                <div key={zone.index} className={styles.zone}>
                  <span
                    className={styles.zoneBar}
                    style={{ backgroundColor: ZONE_COLORS[zone.index - 1] }}
                  />
                  <div className={styles.zoneHead}>
                    <span className={styles.zoneName}>{zone.name}</span>
                    <Tag>
                      {zone.lowerPercent}–{zone.upperPercent}% HRR
                    </Tag>
                  </div>
                  <span className={styles.zoneBpm}>
                    {zone.lowerBpm}–{zone.upperBpm} bpm
                  </span>
                  <span className={styles.sub}>
                    %HRmax 对照：{zone.lowerBpmMaxPercent}–{zone.upperBpmMaxPercent} bpm
                  </span>
                  <span className={styles.purpose}>{zone.purpose}</span>
                </div>
              ))}
            </div>

            <Space wrap>
              <Button onClick={handleCopy}>复制区间</Button>
              {formula === 'gulati' && sex === 'male' ? (
                <span className={styles.sub}>Gulati 公式仅适用于女性，已自动回退到 Tanaka。</span>
              ) : null}
            </Space>
          </>
        )}
      </Card>

      <Card size="small" title="区间说明">
        <ul className={styles.notes}>
          <li>Karvonen 法使用储备心率（HRR = 最大心率 − 静息心率），比单纯按最大心率百分比更贴合个人体能。</li>
          <li>Z1–Z2 适合热身、恢复与有氧基础；Z3–Z4 用于提升耐力与阈值；Z5 仅适合短时间高强度间歇。</li>
          <li>公式估算存在个体误差，若做过实测最大心率测试，填写实测值会优先采用。</li>
          <li>结果用于训练强度参考，如有心血管疾病或不适请遵医嘱。</li>
        </ul>
      </Card>
    </div>
  );
}
