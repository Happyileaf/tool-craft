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
  solveLc,
  UNIT_OPTIONS,
  formatInductance,
  formatCapacitance,
  formatFrequency,
  formatReactance,
  formatAngularFrequency,
  suggestCombinations,
  type LcSolveMode,
  type LcSolution,
  type FormattedQuantity,
} from './utils/lc';
import { EXAMPLE_PRESETS, FIELDS, MODE_OPTIONS, type FieldKey } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface FieldState {
  value: number | null;
  unit: string;
}

function createFieldState(): Record<FieldKey, FieldState> {
  return {
    L: { value: null, unit: FIELDS.L.defaultUnit },
    C: { value: null, unit: FIELDS.C.defaultUnit },
    f: { value: null, unit: FIELDS.f.defaultUnit },
  };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return String(parseFloat(value.toPrecision(8)));
}

function fmt(quantity: FormattedQuantity): string {
  return `${formatNumber(quantity.value)} ${quantity.unit}`;
}

const VISIBLE_KEYS: Record<LcSolveMode, FieldKey[]> = {
  lc: ['L', 'C'],
  lf: ['L', 'f'],
  cf: ['C', 'f'],
  xl: ['L', 'f'],
  xc: ['C', 'f'],
};

interface ResultRow {
  key: string;
  name: string;
  display: string;
  formula: string;
}

function toRows(solution: LcSolution, mode: LcSolveMode): ResultRow[] {
  const rows: ResultRow[] = [];
  if (mode === 'lc') {
    const f = formatFrequency(solution.f);
    rows.push({ key: 'f', name: '谐振频率 f₀', display: fmt(f), formula: solution.formula });
  } else if (mode === 'lf') {
    const C = formatCapacitance(solution.C ?? 0);
    rows.push({ key: 'C', name: '所需电容 C', display: fmt(C), formula: solution.formula });
  } else if (mode === 'cf') {
    const L = formatInductance(solution.L ?? 0);
    rows.push({ key: 'L', name: '所需电感 L', display: fmt(L), formula: solution.formula });
  } else if (mode === 'xl') {
    const Xl = formatReactance(solution.Xl ?? 0);
    rows.push({ key: 'Xl', name: '感抗 Xl', display: fmt(Xl), formula: solution.formula });
  } else {
    const Xc = formatReactance(solution.Xc ?? 0);
    rows.push({ key: 'Xc', name: '容抗 Xc', display: fmt(Xc), formula: solution.formula });
  }

  const omega = formatAngularFrequency(solution.omega);
  rows.push({ key: 'omega', name: '角频率 ω = 2πf', display: fmt(omega), formula: 'ω = 2πf' });

  if (solution.L !== null) {
    const L = formatInductance(solution.L);
    rows.push({ key: 'L', name: '电感 L（基准值）', display: fmt(L), formula: '—' });
  }
  if (solution.C !== null) {
    const C = formatCapacitance(solution.C);
    rows.push({ key: 'C', name: '电容 C（基准值）', display: fmt(C), formula: '—' });
  }
  if (solution.Xl !== null) {
    const Xl = formatReactance(solution.Xl);
    rows.push({ key: 'xlv', name: '感抗 Xl = 2πfL', display: fmt(Xl), formula: 'Xl = 2πfL' });
  }
  if (solution.Xc !== null) {
    const Xc = formatReactance(solution.Xc);
    rows.push({ key: 'xcv', name: '容抗 Xc = 1/(2πfC)', display: fmt(Xc), formula: 'Xc = 1/(2πfC)' });
  }
  return rows;
}

const LcResonanceCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<LcSolveMode>('lc');
  const [fields, setFields] = React.useState<Record<FieldKey, FieldState>>(createFieldState);

  const visibleKeys = VISIBLE_KEYS[mode];

  const outcome = React.useMemo<{ solution?: LcSolution; error?: string }>(() => {
    try {
      const inputs: Parameters<typeof solveLc>[0] = { mode };
      for (const key of visibleKeys) {
        const state = fields[key];
        if (state.value === null) return {};
        const option = UNIT_OPTIONS[key].find((item) => item.label === state.unit);
        inputs[key] = { value: Number(state.value), factor: option?.factor ?? 1 };
      }
      return { solution: solveLc(inputs) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, fields, visibleKeys]);

  const suggestions = React.useMemo(() => {
    if (mode !== 'lc' || !outcome.solution) return [];
    return suggestCombinations(outcome.solution.f).map((item, index) => ({
      key: String(index),
      capacitance: fmt(formatCapacitance(item.capacitance)),
      inductance: fmt(formatInductance(item.inductance)),
    }));
  }, [mode, outcome.solution]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const switchMode = (next: LcSolveMode) => {
    setMode(next);
    const fresh = createFieldState();
    // 切换模式时保留仍为已知量的字段值与单位
    for (const key of VISIBLE_KEYS[next]) {
      if (fields[key].value !== null) {
        fresh[key] = { value: fields[key].value, unit: fields[key].unit };
      }
    }
    setFields(fresh);
  };

  const applyPreset = (index: number) => {
    const preset = EXAMPLE_PRESETS[index];
    if (!preset) return;
    const fresh = createFieldState();
    (Object.keys(preset.inputs) as FieldKey[]).forEach((key) => {
      const input = preset.inputs[key];
      if (input) fresh[key] = { value: input.value, unit: input.unit };
    });
    setMode(preset.mode);
    setFields(fresh);
  };

  const handleCopy = () => {
    if (!outcome.solution) {
      message.warning('暂无可复制的结果');
      return;
    }
    const text = toRows(outcome.solution, mode)
      .map((row) => `${row.name}: ${row.display}（${row.formula}）`)
      .join('\n');
    copyToClipboard(text);
    message.success('结果已复制');
  };

  const columns = [
    { title: '结果量', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '数值（自适应单位）',
      dataIndex: 'display',
      key: 'display',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '公式',
      dataIndex: 'formula',
      key: 'formula',
      render: (text: string) => <Tag className={styles.formulaTag}>{text}</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="LC 谐振频率与电抗计算器"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          理想 LC 回路谐振频率 f₀ = 1/(2π√(LC))，感抗 Xl = 2πfL、容抗 Xc = 1/(2πfC)，
          谐振点满足 Xl = Xc。选择求解模式并填写两个已知量，结果连同 ω、Xl、Xc 实时求出；
          所有计算均在浏览器本地完成。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => switchMode(e.target.value as LcSolveMode)}
          />
          <span className={styles.hint}>{activeMode?.hint}</span>
        </div>

        <div className={styles.fieldGrid}>
          {visibleKeys.map((key) => {
            const def = FIELDS[key];
            const state = fields[key];
            return (
              <div key={key} className={styles.fieldCard}>
                <div className={styles.fieldLabel}>{def.label}</div>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    style={{ flex: 1 }}
                    placeholder={def.placeholder}
                    value={state.value}
                    onChange={(value) =>
                      setFields((previous) => ({
                        ...previous,
                        [key]: {
                          ...previous[key],
                          value: value === null ? null : Number(value),
                        },
                      }))
                    }
                  />
                  <Select
                    style={{ width: 84 }}
                    value={state.unit}
                    onChange={(unit) =>
                      setFields((previous) => ({
                        ...previous,
                        [key]: { ...previous[key], unit },
                      }))
                    }
                    options={UNIT_OPTIONS[key].map((option) => ({
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
        </Space>

        {outcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="无法求解"
            description={outcome.error}
          />
        ) : null}

        {outcome.solution ? (
          <div style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              columns={columns}
              dataSource={toRows(outcome.solution, mode)}
            />
            {(mode === 'lc' || mode === 'lf' || mode === 'cf') && (
              <Descriptions
                className={styles.responseBox}
                size="small"
                bordered
                column={1}
                title="谐振点特性（理想无损 L、C）"
              >
                <Descriptions.Item label="电抗关系">
                  <span className={styles.mono}>
                    Xl = Xc = {fmt(formatReactance(outcome.solution.Xl ?? 0))}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="谐振条件">
                  <span className={styles.mono}>2πf₀L = 1/(2πf₀C)，回路总电抗为 0</span>
                </Descriptions.Item>
              </Descriptions>
            )}
            {suggestions.length > 0 && (
              <>
                <div className={styles.suggestTitle}>
                  在 f₀ = {fmt(formatFrequency(outcome.solution.f))} 下的常用电容选型参考
                </div>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={suggestions}
                  columns={[
                    { title: '标准电容（参考）', dataIndex: 'capacitance', key: 'capacitance' },
                    { title: '对应理想电感', dataIndex: 'inductance', key: 'inductance' },
                  ]}
                />
              </>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default LcResonanceCalculator;
