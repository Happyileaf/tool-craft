'use client';

import { Alert, Button, Card, InputNumber, Radio, Segmented, Space, Statistic, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { CALC_MODE, CONFIDENCE_OPTIONS, SAMPLE_PRESETS, type CalcMode } from './constants';
import styles from './index.module.css';
import {
  adjustForDesignAndResponse,
  calculateMarginOfError,
  calculateSampleSize,
  formatPercent,
} from './utils/sample-size';

const { Text, Paragraph } = Typography;

/**
 * 调查抽样样本量与误差范围计算器
 *
 * 基于 Cochran 公式与有限总体校正（FPC），支持：
 * 1. 由置信水平、误差幅度、预期比例、总体规模求所需样本量
 * 2. 由既定样本量反推可达误差幅度
 * 3. 设计效应与应答率对实际接触样本量的校正
 */
export default function SurveySampleSizeCalculator() {
  const [mode, setMode] = useState<CalcMode>(CALC_MODE.SAMPLE_SIZE);

  // 正向：样本量计算输入
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [marginOfError, setMarginOfError] = useState<number>(5);
  const [proportion, setProportion] = useState<number>(50);
  const [populationSize, setPopulationSize] = useState<number | null>(null);

  // 反向：误差幅度计算输入
  const [sampleSize, setSampleSize] = useState<number>(385);
  const [reverseConfidence, setReverseConfidence] = useState<number>(0.95);
  const [reverseProportion, setReverseProportion] = useState<number>(50);
  const [reversePopulation, setReversePopulation] = useState<number | null>(null);

  // 设计效应与应答率
  const [designEffect, setDesignEffect] = useState<number>(1);
  const [responseRate, setResponseRate] = useState<number>(100);

  const forwardResult = useMemo(() => {
    if (mode !== CALC_MODE.SAMPLE_SIZE) {
      return null;
    }
    try {
      return calculateSampleSize({
        confidenceLevel,
        marginOfError: marginOfError / 100,
        proportion: proportion / 100,
        populationSize: populationSize ?? 0,
      });
    } catch {
      return null;
    }
  }, [mode, confidenceLevel, marginOfError, proportion, populationSize]);

  const reverseResult = useMemo(() => {
    if (mode !== CALC_MODE.MARGIN) {
      return null;
    }
    try {
      return calculateMarginOfError({
        sampleSize,
        confidenceLevel: reverseConfidence,
        proportion: reverseProportion / 100,
        populationSize: reversePopulation ?? 0,
      });
    } catch {
      return null;
    }
  }, [mode, sampleSize, reverseConfidence, reverseProportion, reversePopulation]);

  const adjustedRecruit = useMemo(() => {
    if (!forwardResult) {
      return null;
    }
    try {
      return adjustForDesignAndResponse({
        baseSampleSize: forwardResult.requiredSampleSize,
        designEffect,
        responseRate: responseRate / 100,
      });
    } catch {
      return null;
    }
  }, [forwardResult, designEffect, responseRate]);

  const applyPreset = (preset: (typeof SAMPLE_PRESETS)[number]) => {
    setMode(CALC_MODE.SAMPLE_SIZE);
    setConfidenceLevel(preset.confidenceLevel);
    setMarginOfError(preset.marginOfError * 100);
    setProportion(preset.proportion * 100);
    setPopulationSize(preset.populationSize > 0 ? preset.populationSize : null);
  };

  return (
    <div className={styles.container}>
      <Segmented
        value={mode}
        onChange={(value) => setMode((value as CalcMode) ?? CALC_MODE.SAMPLE_SIZE)}
        options={[
          { label: '由误差要求求样本量', value: CALC_MODE.SAMPLE_SIZE },
          { label: '由样本量反推误差幅度', value: CALC_MODE.MARGIN },
        ]}
        block
      />

      <div className={styles.presetRow}>
        {SAMPLE_PRESETS.map((preset) => (
          <Button key={preset.label} size="small" onClick={() => applyPreset(preset)}>
            {preset.label}
          </Button>
        ))}
      </div>

      {mode === CALC_MODE.SAMPLE_SIZE && (
        <>
          <Card size="small" title="输入参数">
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <span className={styles.label}>置信水平</span>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  value={confidenceLevel}
                  onChange={(event) => setConfidenceLevel(event.target.value)}
                  options={CONFIDENCE_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>误差幅度（±%）</span>
                <InputNumber
                  min={0.1}
                  max={99}
                  step={0.5}
                  value={marginOfError}
                  onChange={(value) => setMarginOfError(value ?? 5)}
                  addonAfter="%"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>预期总体比例 p</span>
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  value={proportion}
                  onChange={(value) => setProportion(value ?? 50)}
                  addonAfter="%"
                />
                <span className={styles.hint}>不确定时保留 50%（最保守，样本量最大）</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>总体规模 N（可选）</span>
                <InputNumber
                  min={1}
                  step={100}
                  placeholder="留空 = 无限总体"
                  value={populationSize}
                  onChange={(value) => setPopulationSize(value)}
                />
                <span className={styles.hint}>填写后自动应用有限总体校正 FPC</span>
              </div>
            </div>
          </Card>

          {forwardResult ? (
            <div className={styles.resultCard}>
              <Space align="baseline">
                <span className={styles.heroNumber}>{forwardResult.requiredSampleSize}</span>
                <span className={styles.heroUnit}>份有效样本</span>
                {forwardResult.finiteCorrectionApplied && <Tag color="blue">已应用 FPC</Tag>}
              </Space>
              <div className={styles.statRow}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>z 分位数</span>
                  <span className={styles.statValue}>{forwardResult.zScore.toFixed(4)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Cochran 原始 n₀</span>
                  <span className={styles.statValue}>{Math.ceil(forwardResult.rawSampleSize)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>校正后（未取整）</span>
                  <span className={styles.statValue}>{forwardResult.adjustedSampleSize.toFixed(2)}</span>
                </div>
              </div>
              <div className={styles.formula}>
                <div>n₀ = z² · p · (1−p) / e² = {forwardResult.zScore.toFixed(4)}² × {formatPercent(proportion / 100, 0)} × {formatPercent(1 - proportion / 100, 0)} / {formatPercent(marginOfError / 100)}²</div>
                {forwardResult.finiteCorrectionApplied && (
                  <div>n = n₀ / (1 + (n₀−1)/N) = {forwardResult.adjustedSampleSize.toFixed(2)} → 向上取整 {forwardResult.requiredSampleSize}</div>
                )}
              </div>
            </div>
          ) : (
            <Alert type="error" showIcon message="输入参数无效，请检查误差幅度与比例是否在合法范围内" />
          )}

          <div className={styles.adjustPanel}>
            <Text strong>实际招募量校正（设计效应 / 应答率）</Text>
            <div className={styles.formGrid} style={{ marginTop: 12 }}>
              <div className={styles.field}>
                <span className={styles.label}>设计效应 deff</span>
                <InputNumber min={1} step={0.1} value={designEffect} onChange={(value) => setDesignEffect(value ?? 1)} />
                <span className={styles.hint}>整群/分层抽样时通常 1.5–3，简单随机抽样为 1</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>预期应答率</span>
                <InputNumber
                  min={1}
                  max={100}
                  step={5}
                  value={responseRate}
                  onChange={(value) => setResponseRate(value ?? 100)}
                  addonAfter="%"
                />
              </div>
            </div>
            {adjustedRecruit !== null && (
              <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                考虑设计效应与无应答后，建议实际接触 / 发放：
                <Text strong style={{ color: 'var(--color-primary, #1677ff)', marginLeft: 8, fontSize: 18 }}>
                  {adjustedRecruit}
                </Text>
                <span className={styles.heroUnit}>份</span>
              </Paragraph>
            )}
          </div>
        </>
      )}

      {mode === CALC_MODE.MARGIN && (
        <>
          <Card size="small" title="输入参数">
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <span className={styles.label}>计划样本量 n</span>
                <InputNumber min={1} step={10} value={sampleSize} onChange={(value) => setSampleSize(value ?? 1)} />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>置信水平</span>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  value={reverseConfidence}
                  onChange={(event) => setReverseConfidence(event.target.value)}
                  options={CONFIDENCE_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>预期总体比例 p</span>
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  value={reverseProportion}
                  onChange={(value) => setReverseProportion(value ?? 50)}
                  addonAfter="%"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>总体规模 N（可选）</span>
                <InputNumber
                  min={1}
                  step={100}
                  placeholder="留空 = 无限总体"
                  value={reversePopulation}
                  onChange={(value) => setReversePopulation(value)}
                />
              </div>
            </div>
          </Card>

          {reverseResult !== null ? (
            <div className={styles.resultCard}>
              <Statistic
                title="可达误差幅度（±）"
                value={reverseResult * 100}
                precision={2}
                suffix="%"
              />
              <div className={styles.formula}>
                <div>
                  e = z · √( p · (1−p) / n ) = {reverseConfidence === 0.95 ? '1.9600' : 'z'} × √(
                  {formatPercent(reverseProportion / 100, 0)} × {formatPercent(1 - reverseProportion / 100, 0)} / {sampleSize} )
                </div>
                {reversePopulation && <div>已按 N={reversePopulation} 做有限总体逆校正</div>}
                {reverseResult === 0 && <div>样本量已覆盖整个总体，理论抽样误差为 0</div>}
              </div>
            </div>
          ) : (
            <Alert type="error" showIcon message="输入参数无效，请检查样本量是否为正整数" />
          )}
        </>
      )}

      <Alert
        type="info"
        showIcon
        message="所有计算均在浏览器本地完成，基于 Cochran (1977) 经典抽样公式；结果为正态近似下的规划参考，小样本或极端比例场景请结合精确二项方法评估。"
      />
    </div>
  );
}
