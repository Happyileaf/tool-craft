'use client';

import React, { useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, InputNumber, Segmented, Select, Space, Statistic, Switch } from 'antd';
import {
  CALC_MODES,
  EXAMPLE_PRESETS,
  LOAD_NEGLECT_RATIO,
  RESISTOR_UNITS,
  VOLTAGE_UNITS,
} from './constants';
import { calculateDivider, solveForR2, type DividerResults } from './utils/divider';
import styles from './index.module.css';

type CalcMode = (typeof CALC_MODES)[number]['value'];

interface NumberFieldProps {
  label: string;
  value: number | null;
  unit: string;
  unitOptions: typeof RESISTOR_UNITS;
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: string) => void;
  min?: number;
  placeholder?: string;
}

/** 数值 + 单位复合输入 */
const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  unit,
  unitOptions,
  onValueChange,
  onUnitChange,
  min = 0,
  placeholder,
}) => (
  <div>
    <div style={{ fontSize: 13, color: 'var(--color-text-3, rgba(0,0,0,0.45))', marginBottom: 4 }}>{label}</div>
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        style={{ flex: 1 }}
        value={value}
        min={min}
        step={0.1}
        precision={6}
        placeholder={placeholder}
        onChange={onValueChange}
      />
      <Select
        style={{ width: 90 }}
        value={unit}
        onChange={onUnitChange}
        options={unitOptions.map((u) => ({ value: u.value, label: u.label }))}
      />
    </Space.Compact>
  </div>
);

const factorOf = (units: typeof RESISTOR_UNITS, unit: string): number =>
  units.find((u) => u.value === unit)?.factor ?? 1;

/** 格式化欧姆值为带单位字符串 */
function formatOhm(ohm: number): string {
  if (!Number.isFinite(ohm)) return '∞';
  if (ohm >= 1e6) return `${trim(ohm / 1e6)} MΩ`;
  if (ohm >= 1e3) return `${trim(ohm / 1e3)} kΩ`;
  return `${trim(ohm)} Ω`;
}

function trim(n: number): string {
  return Number(n.toFixed(4)).toString();
}

/** 分压器原理示意 SVG：Vin → R1 → Vout 节点 → R2(∥RL) → GND */
const DividerDiagram: React.FC<{ withLoad: boolean }> = ({ withLoad }) => (
  <svg className={styles.circuitSvg} viewBox="0 0 420 230" role="img" aria-label="电阻分压器电路示意">
    <line x1="60" y1="20" x2="60" y2="60" stroke="#333" strokeWidth="2" />
    <text x="20" y="26" fontSize="14" fontFamily="monospace">Vin</text>
    {/* R1 锯齿 */}
    <polyline
      points="60,60 52,70 68,80 52,90 68,100 52,110 68,120 60,130"
      fill="none"
      stroke="#1677ff"
      strokeWidth="2"
    />
    <text x="76" y="98" fontSize="13" fill="#1677ff" fontFamily="monospace">R1</text>
    <line x1="60" y1="130" x2="60" y2="150" stroke="#333" strokeWidth="2" />
    {/* Vout 引出 */}
    <circle cx="60" cy="150" r="3" fill="#333" />
    <line x1="60" y1="150" x2="220" y2="150" stroke="#333" strokeWidth="2" />
    <circle cx="220" cy="150" r="3" fill="#333" />
    <text x="228" y="155" fontSize="14" fontFamily="monospace">Vout</text>
    {/* R2 */}
    <polyline
      points="60,150 52,160 68,170 52,180 68,190 52,200 60,210"
      fill="none"
      stroke="#52c41a"
      strokeWidth="2"
    />
    <text x="76" y="186" fontSize="13" fill="#52c41a" fontFamily="monospace">R2</text>
    <line x1="60" y1="210" x2="60" y2="225" stroke="#333" strokeWidth="2" />
    {/* 接地符号 */}
    <line x1="44" y1="225" x2="76" y2="225" stroke="#333" strokeWidth="2" />
    <line x1="50" y1="230" x2="70" y2="230" stroke="#333" strokeWidth="2" />
    {withLoad && (
      <>
        <line x1="220" y1="150" x2="220" y2="180" stroke="#fa8c16" strokeWidth="2" />
        <polyline
          points="220,180 212,188 228,196 212,204 228,212 220,220"
          fill="none"
          stroke="#fa8c16"
          strokeWidth="2"
        />
        <text x="232" y="204" fontSize="13" fill="#fa8c16" fontFamily="monospace">RL（负载）</text>
        <line x1="204" y1="225" x2="236" y2="225" stroke="#333" strokeWidth="2" />
        <line x1="210" y1="230" x2="230" y2="230" stroke="#333" strokeWidth="2" />
      </>
    )}
  </svg>
);

/**
 * 电阻分压器计算器：支持「已知电阻求输出（含负载效应）」与
 * 「已知目标输出反解 R2」两种模式，电阻/电压支持 k/M 与 mV 单位。
 *
 * @param props - 工具组件属性
 * @returns 分压器交互界面
 */
const ResistorVoltageDivider: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<CalcMode>('output');
  const [inputVoltage, setInputVoltage] = React.useState<number | null>(12);
  const [vinUnit, setVinUnit] = useState<string>('V');
  const [r1Val, setR1Val] = React.useState<number | null>(10);
  const [r1Unit, setR1Unit] = useState<string>('kΩ');
  const [r2Val, setR2Val] = React.useState<number | null>(10);
  const [r2Unit, setR2Unit] = useState<string>('kΩ');
  const [targetVout, setTargetVout] = React.useState<number | null>(6);
  const [useLoad, setUseLoad] = React.useState<boolean>(true);
  const [rlVal, setRlVal] = React.useState<number | null>(100);
  const [rlUnit, setRlUnit] = useState<string>('kΩ');

  const vinFactor = factorOf(VOLTAGE_UNITS, vinUnit);
  const r1Factor = factorOf(RESISTOR_UNITS, r1Unit);
  const r2Factor = factorOf(RESISTOR_UNITS, r2Unit);
  const rlFactor = factorOf(RESISTOR_UNITS, rlUnit);

  const inputsReady =
    inputVoltage !== null &&
    inputVoltage > 0 &&
    r1Val !== null &&
    r1Val > 0 &&
    (mode === 'resistor' ? targetVout !== null && targetVout > 0 : r2Val !== null && r2Val > 0);

  let results: DividerResults | null = null;
  let solveResult: { r2: number; warnings: string[] } | null = null;
  let errorMessage: string | null = null;

  if (inputsReady && inputVoltage !== null && r1Val !== null) {
    try {
      const vin = inputVoltage * vinFactor;
      const r1 = r1Val * r1Factor;
      if (mode === 'output' && r2Val !== null) {
        const r2 = r2Val * r2Factor;
        const rl = useLoad && rlVal !== null && rlVal > 0 ? rlVal * rlFactor : null;
        results = calculateDivider({ inputVoltage: vin, r1, r2, rl });
      } else if (mode === 'resistor' && targetVout !== null) {
        solveResult = solveForR2({
          inputVoltage: vin,
          targetOutputVoltage: targetVout * vinFactor,
          r1,
        });
        // 反解结果按空载展示对应输出
        if (Number.isFinite(solveResult.r2) && solveResult.r2 > 0) {
          results = calculateDivider({ inputVoltage: vin, r1, r2: solveResult.r2, rl: null });
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '计算失败';
    }
  }

  const loadPreset = (index: number): void => {
    const preset = EXAMPLE_PRESETS[index];
    if (!preset) return;
    setMode('output');
    setInputVoltage(preset.inputVoltage);
    setVinUnit(preset.inputVoltageUnit);
    setR1Val(preset.r1);
    setR1Unit(preset.r1Unit);
    setR2Val(preset.r2);
    setR2Unit(preset.r2Unit);
    setUseLoad(preset.useLoad);
    setRlVal(preset.rl);
    setRlUnit(preset.rlUnit);
  };

  const voutDisplay = results ? results.outputVoltage / vinFactor : null;

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as CalcMode)}
          options={CALC_MODES.map((m) => ({ label: m.label, value: m.value }))}
        />

        <Card title="电路参数">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space wrap>
              {EXAMPLE_PRESETS.map((preset, i) => (
                <a key={preset.name} onClick={() => loadPreset(i)}>
                  示例：{preset.name}
                </a>
              ))}
            </Space>

            <div style={{ maxWidth: 560 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <NumberField
                  label="输入电压 Vin"
                  value={inputVoltage}
                  unit={vinUnit}
                  unitOptions={VOLTAGE_UNITS}
                  onValueChange={setInputVoltage}
                  onUnitChange={setVinUnit}
                />
                <NumberField
                  label="上拉电阻 R1（Vin 与输出节点之间）"
                  value={r1Val}
                  unit={r1Unit}
                  unitOptions={RESISTOR_UNITS}
                  onValueChange={setR1Val}
                  onUnitChange={setR1Unit}
                />
                {mode === 'output' ? (
                  <NumberField
                    label="下拉电阻 R2（输出节点与地之间）"
                    value={r2Val}
                    unit={r2Unit}
                    unitOptions={RESISTOR_UNITS}
                    onValueChange={setR2Val}
                    onUnitChange={setR2Unit}
                  />
                ) : (
                  <NumberField
                    label="目标输出电压 Vout（空载）"
                    value={targetVout}
                    unit={vinUnit}
                    unitOptions={VOLTAGE_UNITS}
                    onValueChange={setTargetVout}
                    onUnitChange={setVinUnit}
                  />
                )}

                <div>
                  <Space>
                    <Switch checked={useLoad} onChange={setUseLoad} disabled={mode === 'resistor'} />
                    <span>计入负载电阻 RL（与 R2 并联）</span>
                  </Space>
                </div>
                {useLoad && mode === 'output' && (
                  <NumberField
                    label={`负载电阻 RL（建议 ≥ ${LOAD_NEGLECT_RATIO}×R2 以忽略负载效应）`}
                    value={rlVal}
                    unit={rlUnit}
                    unitOptions={RESISTOR_UNITS}
                    onValueChange={setRlVal}
                    onUnitChange={setRlUnit}
                  />
                )}
              </Space>
            </div>

            <DividerDiagram withLoad={useLoad && mode === 'output'} />
          </Space>
        </Card>

        {errorMessage && <Alert type="error" showIcon message={errorMessage} />}

        {!inputsReady && (
          <Alert type="info" showIcon message="请填写全部参数（大于 0 的数值）以获得计算结果。" />
        )}

        {solveResult && solveResult.warnings.map((w) => (
          <Alert key={w} type="warning" showIcon message={w} />
        ))}
        {results?.warnings.map((w) => (
          <Alert key={w} type="warning" showIcon message={w} />
        ))}

        {results && voutDisplay !== null && (
          <Card title="计算结果">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {mode === 'resistor' && solveResult && (
                <Alert
                  type="success"
                  showIcon
                  message={`所需下拉电阻 R2 ≈ ${formatOhm(solveResult.r2)}（空载达到目标电压；带载后需选更小值或用基准源/运放缓冲）`}
                />
              )}
              <Space wrap size="large">
                <Statistic
                  title={`输出电压 Vout（${vinUnit}）`}
                  value={trim(voutDisplay)}
                  valueStyle={{ color: '#1677ff' }}
                />
                <Statistic title="分压比 Vout/Vin" value={trim(results.ratio)} />
                <Statistic title="R2∥RL 等效电阻" value={formatOhm(results.parallelResistance)} />
                <Statistic title="总电流" value={`${trim(results.totalCurrent * 1000)} mA`} />
                <Statistic title="总功耗" value={`${trim(results.totalPower * 1000)} mW`} />
                {useLoad && mode === 'output' && (
                  <>
                    <Statistic title="负载电流" value={`${trim(results.loadCurrent * 1000)} mA`} />
                    <Statistic
                      title="负载致输出跌落"
                      value={`${trim(results.loadRegulationPercent)}%`}
                      valueStyle={{ color: Math.abs(results.loadRegulationPercent) > 5 ? '#cf1322' : undefined }}
                    />
                  </>
                )}
              </Space>
              <Alert
                type="info"
                showIcon
                message="公式与选型提示"
                description={
                  <div className={styles.hint}>
                    空载 Vout = Vin × R2 / (R1 + R2)；带载时先算 Rp = R2∥RL = R2·RL/(R2+RL)，再代入。
                    分压网络会持续耗电（I = Vin/(R1+Rp)），电池供电场景建议用较大阻值；
                    但阻值过大会使输出阻抗升高、易受负载与漏电流影响。若负载变化但要求 Vout 稳定，
                    应改用 LDO、基准源或运放电压跟随器，而非裸电阻分压。
                  </div>
                }
              />
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ResistorVoltageDivider;
