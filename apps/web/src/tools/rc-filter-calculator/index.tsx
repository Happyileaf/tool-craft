'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Radio, Select, Space, Table, Tag, message } from 'antd';
import {
  solveRc,
  UNIT_OPTIONS,
  formatResistance,
  formatCapacitance,
  formatFrequency,
  formatTime,
  formatAngularFrequency,
  type RcSolveMode,
  type RcSolution,
} from './utils/rc';
import { EXAMPLE_PRESETS, FIELDS, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 单个字段的表单状态 */
interface FieldState {
  value: number | null;
  unit: string;
}

type FieldKey = 'R' | 'C' | 'fc';

function createFieldState(): Record<FieldKey, FieldState> {
  return {
    R: { value: 1, unit: FIELDS.R.defaultUnit },
    C: { value: 1, unit: FIELDS.C.defaultUnit },
    fc: { value: null, unit: FIELDS.fc.defaultUnit },
  };
}

/** 数值输出：去掉浮点尾差，最多保留 5 位有效小数 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = parseFloat(value.toPrecision(8));
  return String(rounded);
}

interface ResultRow {
  key: string;
  name: string;
  display: string;
  formula: string;
}

function toRows(solution: RcSolution, mode: RcSolveMode): ResultRow[] {
  const R = formatResistance(solution.R);
  const C = formatCapacitance(solution.C);
  const fc = formatFrequency(solution.fc);
  const tau = formatTime(solution.tau);
  const omega = formatAngularFrequency(solution.omega);
  return [
    {
      key: 'solved',
      name: mode === 'rc' ? '截止频率 fc' : mode === 'rf' ? '所需电容 C' : '所需电阻 R',
      display:
        mode === 'rc'
          ? `${formatNumber(fc.value)} ${fc.unit}`
          : mode === 'rf'
            ? `${formatNumber(C.value)} ${C.unit}`
            : `${formatNumber(R.value)} ${R.unit}`,
      formula: solution.formula,
    },
    {
      key: 'tau',
      name: '时间常数 τ = RC',
      display: `${formatNumber(tau.value)} ${tau.unit}`,
      formula: 'τ = RC',
    },
    {
      key: 'omega',
      name: '角频率 ω',
      display: `${formatNumber(omega.value)} ${omega.unit}`,
      formula: 'ω = 2πfc',
    },
  ];
}

const RcFilterCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<RcSolveMode>('rc');
  const [fields, setFields] = React.useState<Record<FieldKey, FieldState>>(createFieldState);

  const visibleKeys: FieldKey[] =
    mode === 'rc'
      ? ['R', 'C']
      : mode === 'rf'
        ? ['R', 'fc']
        : ['C', 'fc'];

  const outcome = React.useMemo<{ solution?: RcSolution; error?: string }>(() => {
    try {
      const inputs: Parameters<typeof solveRc>[0] = { mode };
      for (const key of visibleKeys) {
        const state = fields[key];
        if (state.value === null) {
          return {};
        }
        const option = UNIT_OPTIONS[key].find((item) => item.label === state.unit);
        inputs[key] = { value: Number(state.value), factor: option?.factor ?? 1 };
      }
      return { solution: solveRc(inputs) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, fields, visibleKeys]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const switchMode = (next: RcSolveMode) => {
    setMode(next);
    const fresh = createFieldState();
    // 切换模式时：目标求解字段清空，其余保留当前已填数值
    const solvedKey: FieldKey = next === 'rc' ? 'fc' : next === 'rf' ? 'C' : 'R';
    (Object.keys(fresh) as FieldKey[]).forEach((key) => {
      if (key !== solvedKey && fields[key].value !== null) {
        fresh[key] = { value: fields[key].value, unit: fields[key].unit };
      }
    });
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
    copyToClipboard(`${text}\n截止点增益：-3.01 dB（幅度 1/√2）；相移：低通 -45° / 高通 +45°`);
    message.success('结果已复制');
  };

  const columns = [
    { title: '结果量', dataIndex: 'name', key: 'name', width: 180 },
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
        title="一阶 RC 滤波器计算器（低通 / 高通截止频率）"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          一阶 RC 网络的截止频率 fc = 1/(2πRC)、时间常数 τ = RC，低通与高通的 fc 相同。
          选择求解模式并填写两个已知量，第三个量连同 τ、ω 实时求出。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => switchMode(e.target.value as RcSolveMode)}
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
                        [key]: { ...previous[key], value: value === null ? null : Number(value) },
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
            <Descriptions
              className={styles.responseBox}
              size="small"
              bordered
              column={1}
              title="fc 处的频率响应（低通 / 高通一致）"
            >
              <Descriptions.Item label="幅度增益">
                <span className={styles.mono}>|H| = 1/√2 ≈ 0.7071（-3.01 dB）</span>
              </Descriptions.Item>
              <Descriptions.Item label="相移">
                <span className={styles.mono}>低通 -45°（滞后）；高通 +45°（超前）</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default RcFilterCalculator;
