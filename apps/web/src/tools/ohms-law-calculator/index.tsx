'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Select, Space, Table, Tag, message } from 'antd';
import { FIELDS, EXAMPLE_PRESETS } from './constants';
import {
  solveOhmsLaw,
  formatQuantity,
  UNIT_OPTIONS,
  type OhmsSolution,
  type QuantityKey,
} from './utils/ohms';
import styles from './index.module.css';

/** 单个字段的表单状态 */
interface FieldState {
  /** 输入数值（按所选单位），null 表示未填写 */
  value: number | null;
  /** 当前所选单位符号 */
  unit: string;
}

/** 初始字段状态：各量默认使用基准单位且未填写 */
function createInitialState(): Record<QuantityKey, FieldState> {
  return {
    V: { value: null, unit: 'V' },
    I: { value: null, unit: 'A' },
    R: { value: null, unit: 'Ω' },
    P: { value: null, unit: 'W' },
  };
}

/** 数值格式化：去掉浮点尾差并保留合适有效位 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  const digits = abs === 0 ? 0 : abs < 0.001 || abs >= 1_000_000 ? 4 : 3;
  // toPrecision 后用 parseFloat 去掉多余的 0
  return String(parseFloat(value.toPrecision(12))).length > 8
    ? value.toPrecision(digits)
    : String(parseFloat(value.toPrecision(12)));
}

/** 结果表格行 */
interface ResultRow {
  key: QuantityKey;
  name: string;
  display: string;
  base: string;
  formula: string;
}

/** 把一组解转换为表格行 */
function toRows(
  solution: Partial<Record<QuantityKey, { value: number; formula: string }>>,
): ResultRow[] {
  const names: Record<QuantityKey, string> = {
    V: '电压',
    I: '电流',
    R: '电阻',
    P: '功率',
  };
  return (Object.keys(solution) as QuantityKey[]).map((key) => {
    const entry = solution[key] as { value: number; formula: string };
    const formatted = formatQuantity(key, entry.value);
    return {
      key,
      name: `${names[key]} ${key}`,
      display: `${formatNumber(formatted.value)} ${formatted.unit}`,
      base: `${formatNumber(entry.value)} ${
        key === 'V' ? 'V' : key === 'I' ? 'A' : key === 'R' ? 'Ω' : 'W'
      }`,
      formula: entry.formula,
    };
  });
}

/**
 * 欧姆定律与功率计算器：填写 V / I / R / P 中任意两个量，
 * 实时求解其余两个量并展示公式、单位换算与双解
 *
 * @returns 欧姆定律计算器交互界面
 */
const OhmsLawCalculator: React.FC<ToolComponentProps> = () => {
  const [fields, setFields] = React.useState<Record<QuantityKey, FieldState>>(createInitialState);

  /** 当前计算结果（含错误信息） */
  const outcome = React.useMemo<{ solution?: OhmsSolution; error?: string }>(() => {
    const filled = (Object.keys(fields) as QuantityKey[]).filter(
      (key) => fields[key]?.value !== null && fields[key]?.value !== undefined,
    );
    if (filled.length === 0) return {};
    if (filled.length !== 2) {
      return { error: `请恰好填写两个已知量（当前填写 ${filled.length} 个），其余两个将自动求解。` };
    }
    try {
      const inputs = {} as Parameters<typeof solveOhmsLaw>[0];
      for (const key of filled) {
        const state = fields[key] as FieldState;
        const option = UNIT_OPTIONS[key].find((item) => item.label === state.unit);
        inputs[key] = { value: state.value as number, factor: option?.factor ?? 1 };
      }
      return { solution: solveOhmsLaw(inputs) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [fields]);

  const filledCount = (Object.keys(fields) as QuantityKey[]).filter(
    (key) => fields[key]?.value !== null && fields[key]?.value !== undefined,
  ).length;

  const applyPreset = (presetIndex: number) => {
    const preset = EXAMPLE_PRESETS[presetIndex];
    if (!preset) return;
    const next = createInitialState();
    for (const [key, value] of Object.entries(preset.inputs) as [
      QuantityKey,
      { value: number; unit: string },
    ][]) {
      next[key] = { value: value.value, unit: value.unit };
    }
    setFields(next);
  };

  const reset = () => setFields(createInitialState());

  const columns = [
    { title: '物理量', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: '结果（自适应单位）',
      dataIndex: 'display',
      key: 'display',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '基准单位值',
      dataIndex: 'base',
      key: 'base',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '所用公式',
      dataIndex: 'formula',
      key: 'formula',
      render: (text: string) => <Tag className={styles.formulaTag}>{text}</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="欧姆定律与功率计算器（V / I / R / P 知二求二）"
        extra={
          <Button
            size="small"
            onClick={() => {
              const text = outcome.solution
                ? toRows(outcome.solution.solved)
                    .map((row) => `${row.name}: ${row.display}（${row.base}）`)
                    .join('\n')
                : '';
              if (!text) {
                message.warning('暂无可复制的结果');
                return;
              }
              navigator.clipboard
                .writeText(text)
                .then(() => message.success('结果已复制'))
                .catch(() => message.error('复制失败，请手动选择复制'));
            }}
          >
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          在四个量中恰好填写两个，其余两个自动求解。关系：V = I·R，P = V·I = I²·R = V²/R。
        </p>

        <div className={styles.fieldGrid}>
          {FIELDS.map((field) => {
            const state = fields[field.key];
            return (
              <div key={field.key} className={styles.fieldCard}>
                <div className={styles.fieldLabel}>{field.label}</div>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    style={{ flex: 1 }}
                    placeholder={field.placeholder}
                    value={state.value}
                    onChange={(value) =>
                      setFields((previous) => ({
                        ...previous,
                        [field.key]: { ...previous[field.key], value: value === null ? null : Number(value) },
                      }))
                    }
                  />
                  <Select
                    style={{ width: 84 }}
                    value={state.unit}
                    onChange={(unit) =>
                      setFields((previous) => ({
                        ...previous,
                        [field.key]: { ...previous[field.key], unit },
                      }))
                    }
                    options={UNIT_OPTIONS[field.key].map((option) => ({
                      label: option.label,
                      value: option.label,
                    }))}
                  />
                </Space.Compact>
              </div>
            );
          })}
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <span className={styles.label}>示例：</span>
          {EXAMPLE_PRESETS.map((preset, index) => (
            <Button key={preset.name} size="small" onClick={() => applyPreset(index)}>
              {preset.name}
            </Button>
          ))}
          <Button size="small" onClick={reset}>
            清空
          </Button>
        </Space>

        {filledCount > 0 && outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法求解" description={outcome.error} />
        ) : null}

        {outcome.solution ? (
          <div style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              columns={columns}
              dataSource={toRows(outcome.solution.solved)}
            />
            {outcome.solution.dualNote ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="该组合存在正、负两个数学解"
                description={
                  <div>
                    <p style={{ margin: '0 0 8px' }}>{outcome.solution.dualNote}</p>
                    <Descriptions size="small" bordered column={2}>
                      {(Object.keys(outcome.solution.negative ?? {}) as QuantityKey[]).map((key) => {
                        const entry = outcome.solution?.negative?.[key];
                        if (!entry) return null;
                        const formatted = formatQuantity(key, entry.value);
                        return (
                          <Descriptions.Item key={key} label={`负极性 ${key}`}>
                            <span className={styles.mono}>
                              {formatNumber(formatted.value)} {formatted.unit}（{entry.formula}）
                            </span>
                          </Descriptions.Item>
                        );
                      })}
                    </Descriptions>
                  </div>
                }
              />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default OhmsLawCalculator;
