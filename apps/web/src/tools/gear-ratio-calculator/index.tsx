'use client';

import { Alert, Button, Card, InputNumber, Segmented, Slider, Space, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  calculateDrivenTeeth,
  calculateMultiStage,
  calculateSingleStage,
} from './utils/gear';
import type { GearStage, MultiStageResult, SingleStageResult } from './utils/gear';
import styles from './index.module.css';

type Mode = 'single' | 'multi' | 'reverse';

type CalcResult =
  | { ok: true; mode: 'single'; data: SingleStageResult }
  | { ok: true; mode: 'multi'; data: MultiStageResult }
  | { ok: true; mode: 'reverse'; data: number }
  | { ok: false; error: string };

const PRESETS = [
  { label: '3:1', stage: { driverTeeth: 12, drivenTeeth: 36 } },
  { label: '4:1', stage: { driverTeeth: 10, drivenTeeth: 40 } },
  { label: '5:1', stage: { driverTeeth: 12, drivenTeeth: 60 } },
];

export default function GearRatioCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('single');
  const [driverTeeth, setDriverTeeth] = useState(12);
  const [drivenTeeth, setDrivenTeeth] = useState(defaultInput ? Number(defaultInput) || 36 : 36);
  const [inputRpm, setInputRpm] = useState(1200);
  const [inputTorque, setInputTorque] = useState(10);
  const [efficiency, setEfficiency] = useState(100);
  const [stages, setStages] = useState<GearStage[]>([
    { driverTeeth: 12, drivenTeeth: 36 },
    { driverTeeth: 10, drivenTeeth: 40 },
  ]);
  const [targetOutputRpm, setTargetOutputRpm] = useState(400);

  const result = useMemo<CalcResult>(() => {
    try {
      if (mode === 'single') {
        return {
          ok: true,
          mode: 'single',
          data: calculateSingleStage(driverTeeth, drivenTeeth, inputRpm, inputTorque, efficiency),
        };
      }
      if (mode === 'multi') {
        return {
          ok: true,
          mode: 'multi',
          data: calculateMultiStage(stages, inputRpm, inputTorque, efficiency),
        };
      }
      return {
        ok: true,
        mode: 'reverse',
        data: calculateDrivenTeeth(driverTeeth, inputRpm, targetOutputRpm),
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [mode, driverTeeth, drivenTeeth, inputRpm, inputTorque, efficiency, stages, targetOutputRpm]);

  const updateStage = (index: number, patch: Partial<GearStage>) => {
    setStages((current) =>
      current.map((stage, stageIndex) => (stageIndex === index ? { ...stage, ...patch } : stage)),
    );
  };

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    let text = '';
    if (result.mode === 'single') {
      const data = result.data;
      text = [
        `传动比：${data.ratio.toFixed(3)}（${data.ratioNumerator}:${data.ratioDenominator}）`,
        `输出转速：${data.outputRpm.toFixed(1)} RPM`,
        `输出扭矩：${data.outputTorque.toFixed(2)} N·m`,
        `方向：${data.direction}`,
      ].join('\n');
    } else if (result.mode === 'multi') {
      const data = result.data;
      text = [
        `总传动比：${data.totalRatio.toFixed(3)}（${data.ratioNumerator}:${data.ratioDenominator}）`,
        `输出转速：${data.outputRpm.toFixed(1)} RPM`,
        `输出扭矩：${data.outputTorque.toFixed(2)} N·m`,
        `方向：${data.direction}`,
        ...data.stages.map(
          (stage, index) =>
            `第 ${index + 1} 级 ${stage.driverTeeth}:${stage.drivenTeeth} → ${stage.ratio.toFixed(3)}，${stage.outputRpm.toFixed(1)} RPM`,
        ),
      ].join('\n');
    } else {
      text = `所需从动轮齿数：${result.data}`;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="传动计算">
        <Segmented
          className={styles.modeRow}
          value={mode}
          onChange={(value) => setMode(value as Mode)}
          options={[
            { label: '单级齿轮', value: 'single' },
            { label: '多级串联', value: 'multi' },
            { label: '反推齿数', value: 'reverse' },
          ]}
        />

        {mode === 'single' ? (
          <>
            <div className={styles.inputs}>
              <label className={styles.field}>
                <span className={styles.label}>主动轮齿数</span>
                <InputNumber min={1} max={500} value={driverTeeth} onChange={(value) => setDriverTeeth(value ?? 12)} style={{ width: 120 }} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>从动轮齿数</span>
                <InputNumber min={1} max={500} value={drivenTeeth} onChange={(value) => setDrivenTeeth(value ?? 36)} style={{ width: 120 }} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>输入转速（RPM）</span>
                <InputNumber min={1} value={inputRpm} onChange={(value) => setInputRpm(value ?? 1200)} style={{ width: 150 }} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>输入扭矩（N·m）</span>
                <InputNumber min={0} value={inputTorque} onChange={(value) => setInputTorque(value ?? 10)} style={{ width: 150 }} />
              </label>
            </div>
            <div className={styles.presets}>
              <span className={styles.label}>常用减速比：</span>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  onClick={() => {
                    setDriverTeeth(preset.stage.driverTeeth);
                    setDrivenTeeth(preset.stage.drivenTeeth);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </>
        ) : null}

        {mode === 'multi' ? (
          <>
            <div className={styles.stageList}>
              {stages.map((stage, index) => (
                <div key={index} className={styles.stageRow}>
                  <Tag color="blue">第 {index + 1} 级</Tag>
                  <label className={styles.inlineField}>
                    <span className={styles.label}>主动轮</span>
                    <InputNumber
                      min={1}
                      max={500}
                      value={stage.driverTeeth}
                      onChange={(value) => updateStage(index, { driverTeeth: value ?? 1 })}
                      style={{ width: 100 }}
                    />
                  </label>
                  <label className={styles.inlineField}>
                    <span className={styles.label}>从动轮</span>
                    <InputNumber
                      min={1}
                      max={500}
                      value={stage.drivenTeeth}
                      onChange={(value) => updateStage(index, { drivenTeeth: value ?? 1 })}
                      style={{ width: 100 }}
                    />
                  </label>
                  <Button
                    danger
                    size="small"
                    disabled={stages.length === 1}
                    onClick={() => setStages((current) => current.filter((_, stageIndex) => stageIndex !== index))}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
            <Space wrap className={styles.actions}>
              <Button onClick={() => setStages((current) => [...current, { driverTeeth: 12, drivenTeeth: 36 }])}>
                添加一级
              </Button>
              <label className={styles.inlineField}>
                <span className={styles.label}>输入转速（RPM）</span>
                <InputNumber min={1} value={inputRpm} onChange={(value) => setInputRpm(value ?? 1200)} style={{ width: 130 }} />
              </label>
              <label className={styles.inlineField}>
                <span className={styles.label}>输入扭矩（N·m）</span>
                <InputNumber min={0} value={inputTorque} onChange={(value) => setInputTorque(value ?? 10)} style={{ width: 130 }} />
              </label>
            </Space>
          </>
        ) : null}

        {mode === 'reverse' ? (
          <div className={styles.inputs}>
            <label className={styles.field}>
              <span className={styles.label}>主动轮齿数</span>
              <InputNumber min={1} max={500} value={driverTeeth} onChange={(value) => setDriverTeeth(value ?? 12)} style={{ width: 120 }} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>输入转速（RPM）</span>
              <InputNumber min={1} value={inputRpm} onChange={(value) => setInputRpm(value ?? 1200)} style={{ width: 150 }} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>目标输出转速（RPM）</span>
              <InputNumber min={1} value={targetOutputRpm} onChange={(value) => setTargetOutputRpm(value ?? 400)} style={{ width: 170 }} />
            </label>
          </div>
        ) : null}

        {mode !== 'reverse' ? (
          <div className={styles.efficiency}>
            <span className={styles.label}>传动效率：{efficiency}%（每级）</span>
            <Slider min={50} max={100} value={efficiency} onChange={setEfficiency} tooltip={{ formatter: (value) => `${value}%` }} />
          </div>
        ) : null}

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            {result.mode === 'single' ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.label}>传动比</span>
                  <span className={styles.value}>{result.data.ratio.toFixed(3)}</span>
                  <span className={styles.sub}>
                    化简 {result.data.ratioNumerator}:{result.data.ratioDenominator}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>输出转速</span>
                  <span className={styles.value}>{result.data.outputRpm.toFixed(1)} RPM</span>
                  <span className={styles.sub}>输入 {inputRpm} RPM</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>输出扭矩</span>
                  <span className={styles.value}>{result.data.outputTorque.toFixed(2)} N·m</span>
                  <span className={styles.sub}>效率 {efficiency}%</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>旋转方向</span>
                  <span className={styles.value}>{result.data.direction}</span>
                  <span className={styles.sub}>外啮合单级反向</span>
                </div>
              </div>
            ) : null}

            {result.mode === 'multi' ? (
              <>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.label}>总传动比</span>
                    <span className={styles.value}>{result.data.totalRatio.toFixed(3)}</span>
                    <span className={styles.sub}>
                      化简 {result.data.ratioNumerator}:{result.data.ratioDenominator}
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>输出转速</span>
                    <span className={styles.value}>{result.data.outputRpm.toFixed(1)} RPM</span>
                    <span className={styles.sub}>共 {result.data.stages.length} 级</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>输出扭矩</span>
                    <span className={styles.value}>{result.data.outputTorque.toFixed(2)} N·m</span>
                    <span className={styles.sub}>效率按级累乘</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>旋转方向</span>
                    <span className={styles.value}>{result.data.direction}</span>
                    <span className={styles.sub}>方向按级数奇偶判定</span>
                  </div>
                </div>
                <div className={styles.stageList}>
                  {result.data.stages.map((stage, index) => (
                    <div key={index} className={styles.stageRow}>
                      <Tag color="blue">第 {index + 1} 级</Tag>
                      <span>
                        {stage.driverTeeth} → {stage.drivenTeeth} 齿
                      </span>
                      <span className={styles.sub}>传动比 {stage.ratio.toFixed(3)}</span>
                      <span className={styles.sub}>{stage.outputRpm.toFixed(1)} RPM</span>
                      <Tag>{stage.direction}</Tag>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {result.mode === 'reverse' ? (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.label}>所需从动轮齿数</span>
                  <span className={styles.value}>{result.data} 齿</span>
                  <span className={styles.sub}>按传动比 {inputRpm} / {targetOutputRpm} 计算</span>
                </div>
              </div>
            ) : null}

            <Button onClick={handleCopy}>复制结果</Button>
          </>
        )}
      </Card>

      <Card size="small" title="计算说明">
        <ul className={styles.notes}>
          <li>传动比 i = 从动轮齿数 / 主动轮齿数；减速传动时 i 大于 1，输出转速下降、扭矩上升。</li>
          <li>多级串联的总传动比等于各级传动比之积，效率按每级相乘，方向按级数奇偶交替。</li>
          <li>输出扭矩按理想无损失计算后再乘效率；实际选型还需考虑模数、齿宽、材料强度与安全系数。</li>
          <li>反推齿数仅适用于单级减速，结果取整到 3 位小数，实际齿数需取可加工的整数。</li>
        </ul>
      </Card>
    </div>
  );
}
