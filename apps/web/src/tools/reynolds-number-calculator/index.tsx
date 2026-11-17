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
  Table,
  Tag,
  message,
} from 'antd';
import {
  DIAMETER_UNITS,
  VELOCITY_UNITS,
  FLOW_RATE_UNITS,
  KINEMATIC_VISCOSITY_UNITS,
  DENSITY_UNITS,
  ROUGHNESS_UNITS,
  calculatePipeFlow,
  flowRateFromVelocity,
  velocityFromFlowRate,
  type PipeFlowResult,
  type UnitOption,
} from './utils/pipe-flow';
import { FLUID_PRESETS, PIPE_ROUGHNESS_HINTS, REGIME_META, type InputMode } from './constants';
import styles from './index.module.css';

/** 可空数值 */
type NullableNumber = number | null;

/** 组件表单状态 */
interface FormState {
  mode: InputMode;
  velocity: { value: NullableNumber; unit: string };
  flowRate: { value: NullableNumber; unit: string };
  diameter: { value: NullableNumber; unit: string };
  viscosity: { value: NullableNumber; unit: string };
  roughness: { value: NullableNumber; unit: string };
  density: { value: NullableNumber; unit: string };
  fluidPreset: string;
}

/** 初始表单：20 °C 清水 + 50 mm 管 + 1 m/s */
function createInitialState(): FormState {
  const water = FLUID_PRESETS[0] as (typeof FLUID_PRESETS)[number];
  return {
    mode: 'velocity',
    velocity: { value: 1, unit: 'm/s' },
    flowRate: { value: null, unit: 'm³/h' },
    diameter: { value: 50, unit: 'mm' },
    viscosity: { value: water.kinematicViscosity * 1e6, unit: 'mm²/s (cSt)' },
    roughness: { value: 0, unit: 'mm' },
    density: { value: water.density, unit: 'kg/m³' },
    fluidPreset: water.name,
  };
}

/** 按标签查单位倍率 */
function factorOf(options: UnitOption[], label: string): number {
  return options.find((item) => item.label === label)?.factor ?? 1;
}

/** 数值紧凑格式化 */
function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(digits - 1);
  return String(parseFloat(value.toPrecision(8)));
}

/**
 * 雷诺数与管内流态判定计算器
 *
 * @returns 管流计算交互界面
 */
const ReynoldsNumberCalculator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<FormState>(createInitialState);

  const patch = (key: keyof FormState, value: unknown) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  /** 选择介质预设时回填 ν 与 ρ（自定义不覆盖） */
  const applyFluidPreset = (name: string) => {
    const preset = FLUID_PRESETS.find((item) => item.name === name);
    patch('fluidPreset', name);
    if (!preset || name === '自定义') return;
    setForm((previous) => ({
      ...previous,
      fluidPreset: name,
      viscosity: { value: parseFloat((preset.kinematicViscosity * 1e6).toPrecision(6)), unit: 'mm²/s (cSt)' },
      density: { value: preset.density, unit: 'kg/m³' },
    }));
  };

  /** 计算结果（含错误信息） */
  const outcome = React.useMemo<{ result?: PipeFlowResult; error?: string; crossVelocity?: number }>(
    () => {
      try {
        const diameterBase =
          ((form.diameter.value ?? NaN) as number) * factorOf(DIAMETER_UNITS, form.diameter.unit);
        if (!Number.isFinite(diameterBase) || diameterBase <= 0) {
          return { error: '请填写大于 0 的管径。' };
        }
        const viscosityBase =
          ((form.viscosity.value ?? NaN) as number) *
          factorOf(KINEMATIC_VISCOSITY_UNITS, form.viscosity.unit);
        if (!Number.isFinite(viscosityBase) || viscosityBase <= 0) {
          return { error: '请填写大于 0 的运动黏度。' };
        }

        let velocityBase: number;
        let crossVelocity: number | undefined;
        if (form.mode === 'velocity') {
          velocityBase =
            ((form.velocity.value ?? NaN) as number) * factorOf(VELOCITY_UNITS, form.velocity.unit);
          if (!Number.isFinite(velocityBase) || velocityBase <= 0) {
            return { error: '请填写大于 0 的流速。' };
          }
          crossVelocity = velocityBase;
        } else {
          const qBase =
            ((form.flowRate.value ?? NaN) as number) *
            factorOf(FLOW_RATE_UNITS, form.flowRate.unit);
          if (!Number.isFinite(qBase) || qBase <= 0) {
            return { error: '请填写大于 0 的体积流量。' };
          }
          velocityBase = velocityFromFlowRate(qBase, diameterBase);
          crossVelocity = velocityBase;
        }

        const roughnessField = form.roughness;
        const hasRoughness = roughnessField.value !== null && roughnessField.value !== undefined;
        const roughnessBase = hasRoughness
          ? (roughnessField.value as number) * factorOf(ROUGHNESS_UNITS, roughnessField.unit)
          : 0;

        const hasDensity = form.density.value !== null && form.density.value !== undefined;
        const densityBase = hasDensity
          ? (form.density.value as number) * factorOf(DENSITY_UNITS, form.density.unit)
          : undefined;

        const result = calculatePipeFlow({
          velocity: velocityBase,
          diameter: diameterBase,
          kinematicViscosity: viscosityBase,
          roughness: roughnessBase,
          density: densityBase,
        });
        return { result, crossVelocity };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
    [form],
  );

  const reset = () => setForm(createInitialState());

  /** 复制结果文本 */
  const copyResult = () => {
    if (!outcome.result) {
      message.warning('暂无可复制的结果');
      return;
    }
    const r = outcome.result;
    const lines = [
      `雷诺数 Re: ${formatNumber(r.re)}（${REGIME_META[r.regime].label}）`,
      `Darcy 摩擦系数 f: ${r.friction === null ? '临界区不适用' : formatNumber(r.friction, 5)}`,
      `单位长度水头损失 hf/L: ${
        r.headLossGradient === null ? '—' : `${formatNumber(r.headLossGradient * 1000)} mm/m`
      }`,
      `单位长度压降 ΔP/L: ${
        r.pressureGradient === null ? '—' : `${formatNumber(r.pressureGradient * 100)} kPa/100m`
      }`,
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const regime = outcome.result ? REGIME_META[outcome.result.regime] : null;

  /** 结果表格数据源 */
  const resultRows = outcome.result
    ? [
        {
          key: 're',
          name: '雷诺数 Re',
          value: formatNumber(outcome.result.re),
          note: 'Re = v·d / ν',
        },
        {
          key: 'f',
          name: 'Darcy 摩擦系数 f',
          value:
            outcome.result.friction === null ? '不适用（临界区）' : formatNumber(outcome.result.friction, 5),
          note:
            outcome.result.regime === 'laminar'
              ? '层流 f = 64/Re'
              : outcome.result.regime === 'turbulent'
                ? 'Swamee–Jain 显式式'
                : '临界区公式不确定',
        },
        {
          key: 'hf',
          name: '沿程水头损失 hf/L',
          value:
            outcome.result.headLossGradient === null
              ? '—'
              : `${formatNumber(outcome.result.headLossGradient * 1000)} mm/m`,
          note: 'hf/L = f·v²/(2g·d)',
        },
        {
          key: 'hf2',
          name: '沿程水头损失 hf/L',
          value:
            outcome.result.headLossGradient === null
              ? '—'
              : `${formatNumber(outcome.result.headLossGradient * 100)} m/100m`,
          note: '毫米/米 换算为 米/百米',
        },
        {
          key: 'dp',
          name: '压降 ΔP/L',
          value:
            outcome.result.pressureGradient === null
              ? '—'
              : `${formatNumber(outcome.result.pressureGradient)} Pa/m`,
          note: 'ΔP/L = ρ·g·(hf/L)',
        },
        {
          key: 'dp2',
          name: '压降 ΔP/L',
          value:
            outcome.result.pressureGradient === null
              ? '—'
              : `${formatNumber(outcome.result.pressureGradient * 100)} kPa/100m`,
          note: '帕/米 换算为 千帕/百米',
        },
      ]
    : [];

  return (
    <div className={styles.container}>
      <Card
        title="雷诺数与管内流态判定计算器（圆管沿程阻力）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          输入流速（或体积流量）、管径与流体运动黏度，计算雷诺数 Re 并判定层流 / 临界 / 湍流，
          进一步求 Darcy 摩擦系数、单位长度沿程水头损失与压降。全部计算在浏览器本地完成。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>输入模式</div>
            <Radio.Group
              value={form.mode}
              onChange={(event) => patch('mode', event.target.value as InputMode)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="velocity">流速 v + 内径 d</Radio.Button>
              <Radio.Button value="flowRate">流量 Q + 内径 d</Radio.Button>
            </Radio.Group>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>介质预设</div>
            <Select
              style={{ width: '100%' }}
              value={form.fluidPreset}
              onChange={applyFluidPreset}
              options={FLUID_PRESETS.map((item) => ({ label: item.name, value: item.name }))}
            />
          </div>

          {form.mode === 'velocity' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>平均流速 v</div>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  style={{ flex: 1 }}
                  placeholder="如 1"
                  value={form.velocity.value}
                  onChange={(value) =>
                    patch('velocity', { ...form.velocity, value: value === null ? null : Number(value) })
                  }
                />
                <Select
                  style={{ width: 92 }}
                  value={form.velocity.unit}
                  onChange={(unit) => patch('velocity', { ...form.velocity, unit })}
                  options={VELOCITY_UNITS.map((u) => ({ label: u.label, value: u.label }))}
                />
              </Space.Compact>
            </div>
          ) : (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>体积流量 Q</div>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  style={{ flex: 1 }}
                  placeholder="如 7.07"
                  value={form.flowRate.value}
                  onChange={(value) =>
                    patch('flowRate', { ...form.flowRate, value: value === null ? null : Number(value) })
                  }
                />
                <Select
                  style={{ width: 96 }}
                  value={form.flowRate.unit}
                  onChange={(unit) => patch('flowRate', { ...form.flowRate, unit })}
                  options={FLOW_RATE_UNITS.map((u) => ({ label: u.label, value: u.label }))}
                />
              </Space.Compact>
            </div>
          )}

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>圆管内径 d</div>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ flex: 1 }}
                placeholder="如 50"
                value={form.diameter.value}
                onChange={(value) =>
                  patch('diameter', { ...form.diameter, value: value === null ? null : Number(value) })
                }
              />
              <Select
                style={{ width: 84 }}
                value={form.diameter.unit}
                onChange={(unit) => patch('diameter', { ...form.diameter, unit })}
                options={DIAMETER_UNITS.map((u) => ({ label: u.label, value: u.label }))}
              />
            </Space.Compact>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>运动黏度 ν</div>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ flex: 1 }}
                placeholder="如 1.004"
                value={form.viscosity.value}
                onChange={(value) =>
                  patch('viscosity', { ...form.viscosity, value: value === null ? null : Number(value) })
                }
              />
              <Select
                style={{ width: 118 }}
                value={form.viscosity.unit}
                onChange={(unit) => patch('viscosity', { ...form.viscosity, unit })}
                options={KINEMATIC_VISCOSITY_UNITS.map((u) => ({ label: u.label, value: u.label }))}
              />
            </Space.Compact>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>管壁绝对粗糙度 ε（光滑管留空或 0）</div>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ flex: 1 }}
                placeholder="如 0.045"
                value={form.roughness.value}
                onChange={(value) =>
                  patch('roughness', { ...form.roughness, value: value === null ? null : Number(value) })
                }
              />
              <Select
                style={{ width: 84 }}
                value={form.roughness.unit}
                onChange={(unit) => patch('roughness', { ...form.roughness, unit })}
                options={ROUGHNESS_UNITS.map((u) => ({ label: u.label, value: u.label }))}
              />
            </Space.Compact>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>流体密度 ρ（留空则不计算压降）</div>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ flex: 1 }}
                placeholder="如 998.2"
                value={form.density.value}
                onChange={(value) =>
                  patch('density', { ...form.density, value: value === null ? null : Number(value) })
                }
              />
              <Select
                style={{ width: 96 }}
                value={form.density.unit}
                onChange={(unit) => patch('density', { ...form.density, unit })}
                options={DENSITY_UNITS.map((u) => ({ label: u.label, value: u.label }))}
              />
            </Space.Compact>
          </div>
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <Button size="small" onClick={reset}>
            重置为示例
          </Button>
          {form.mode === 'flowRate' && outcome.crossVelocity !== undefined ? (
            <Tag className={styles.formulaTag}>
              折算流速 v ≈ {formatNumber(outcome.crossVelocity)} m/s（Q = v·πd²/4）
            </Tag>
          ) : null}
          {form.mode === 'velocity' && outcome.crossVelocity !== undefined ? (
            <Tag className={styles.formulaTag}>
              折算流量 Q ≈ {formatNumber(flowRateFromVelocity(outcome.crossVelocity,
                ((form.diameter.value ?? 0) as number) * factorOf(DIAMETER_UNITS, form.diameter.unit)) * 3600)} m³/h
            </Tag>
          ) : null}
        </Space>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={outcome.error} />
        ) : null}

        {outcome.result && regime ? (
          <div style={{ marginTop: 16 }}>
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item label="流态判定">
                <Tag color={regime.color}>{regime.label}</Tag>
                <span className={styles.hintInline}>Re 分界：2300 / 4000</span>
              </Descriptions.Item>
              <Descriptions.Item label="相对粗糙度 ε/d">
                <span className={styles.mono}>{formatNumber(outcome.result.relativeRoughness, 5)}</span>
              </Descriptions.Item>
            </Descriptions>
            <p className={styles.regimeNote}>{regime.description}</p>

            <Table
              style={{ marginTop: 12 }}
              size="small"
              pagination={false}
              dataSource={resultRows}
              columns={[
                { title: '物理量', dataIndex: 'name', key: 'name', width: 200 },
                {
                  title: '结果',
                  dataIndex: 'value',
                  key: 'value',
                  render: (text: string) => <span className={styles.mono}>{text}</span>,
                },
                {
                  title: '说明 / 公式',
                  dataIndex: 'note',
                  key: 'note',
                  render: (text: string) => <Tag className={styles.formulaTag}>{text}</Tag>,
                },
              ]}
            />

            {outcome.result.warnings.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="计算警告"
                description={
                  <ul className={styles.warningList}>
                    {outcome.result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
          </div>
        ) : null}

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="常用管材绝对粗糙度参考（mm，仅提示）"
          description={
            <ul className={styles.warningList}>
              {PIPE_ROUGHNESS_HINTS.map((hint) => (
                <li key={hint.material}>
                  {hint.material}：{hint.rangeMm}
                </li>
              ))}
            </ul>
          }
        />
      </Card>
    </div>
  );
};

export default ReynoldsNumberCalculator;
