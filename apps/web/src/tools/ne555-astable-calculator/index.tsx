'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Radio, Select, Space, Table, Tag, message } from 'antd';
import {
  solveAstable,
  RESISTANCE_UNITS,
  CAPACITANCE_UNITS,
  formatTime,
  formatFrequency,
  formatNumber,
  formatPercent,
  MAX_TYPICAL_FREQUENCY,
  type Timer555Mode,
  type Timer555Solution,
  type UnitOption,
} from './utils/timer555';
import { EXAMPLE_PRESETS, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface FieldState {
  value: number | null;
  unit: string;
}

function factorOf(units: UnitOption[], label: string): number {
  return units.find((item) => item.label === label)?.factor ?? 1;
}

interface ResultRow {
  key: string;
  name: string;
  display: string;
  formula: string;
}

function toRows(solution: Timer555Solution): ResultRow[] {
  const tHigh = formatTime(solution.tHigh);
  const tLow = formatTime(solution.tLow);
  const period = formatTime(solution.period);
  const frequency = formatFrequency(solution.frequency);
  return [
    {
      key: 'tHigh',
      name: '高电平时间 t1',
      display: `${formatNumber(tHigh.value)} ${tHigh.unit}`,
      formula: solution.mode === 'diode' ? 't1 = ln2·R1·C' : 't1 = ln2·(R1+R2)·C',
    },
    {
      key: 'tLow',
      name: '低电平时间 t2',
      display: `${formatNumber(tLow.value)} ${tLow.unit}`,
      formula: 't2 = ln2·R2·C',
    },
    {
      key: 'period',
      name: '周期 T = t1 + t2',
      display: `${formatNumber(period.value)} ${period.unit}`,
      formula: 'T = t1 + t2',
    },
    {
      key: 'frequency',
      name: '振荡频率 f',
      display: `${formatNumber(frequency.value)} ${frequency.unit}`,
      formula: 'f = 1 / T',
    },
    {
      key: 'duty',
      name: '占空比 D',
      display: formatPercent(solution.dutyCycle),
      formula: 'D = t1 / T',
    },
  ];
}

/** 根据 t1/t2 比例生成方波示意路径（纯展示，由解直接推导） */
function WaveformSvg({ solution }: { solution: Timer555Solution }) {
  const width = 320;
  const height = 96;
  const pad = 8;
  const high = pad;
  const low = height - pad;
  const ratio = solution.tHigh / solution.period;
  const w1 = (width - pad * 2) * ratio;
  const x0 = pad;
  const x1 = x0 + w1;
  const x2 = width - pad;
  const path = `M ${x0} ${high} L ${x1} ${high} L ${x1} ${low} L ${x2} ${low}`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="输出方波示意">
      <line x1={0} y1={high} x2={width} y2={high} stroke="rgba(0,0,0,0.12)" strokeDasharray="4 4" />
      <line x1={0} y1={low} x2={width} y2={low} stroke="rgba(0,0,0,0.12)" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="#1677ff" strokeWidth={2} />
      <text x={x0 + 2} y={high - 1} fontSize={10} fill="rgba(0,0,0,0.45)">
        Vcc
      </text>
      <text x={x2 - 24} y={low + 12} fontSize={10} fill="rgba(0,0,0,0.45)">
        0 V
      </text>
      <text x={x0 + w1 / 2 - 10} y={height / 2 + 4} fontSize={10} fill="rgba(0,0,0,0.65)">
        t1
      </text>
      <text x={x1 + (x2 - x1) / 2 - 10} y={height / 2 + 4} fontSize={10} fill="rgba(0,0,0,0.65)">
        t2
      </text>
    </svg>
  );
}

const Ne555AstableCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Timer555Mode>('classic');
  const [R1, setR1] = React.useState<FieldState>({ value: 1, unit: 'kΩ' });
  const [R2, setR2] = React.useState<FieldState>({ value: 1, unit: 'kΩ' });
  const [C, setC] = React.useState<FieldState>({ value: 1, unit: 'µF' });

  const outcome = React.useMemo<{ solution?: Timer555Solution; error?: string }>(() => {
    try {
      if (R1.value === null || R2.value === null || C.value === null) return {};
      return {
        solution: solveAstable({
          mode,
          R1: { value: Number(R1.value), factor: factorOf(RESISTANCE_UNITS, R1.unit) },
          R2: { value: Number(R2.value), factor: factorOf(RESISTANCE_UNITS, R2.unit) },
          C: { value: Number(C.value), factor: factorOf(CAPACITANCE_UNITS, C.unit) },
        }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, R1, R2, C]);

  const applyPreset = (index: number) => {
    const preset = EXAMPLE_PRESETS[index];
    if (!preset) return;
    setMode(preset.mode);
    setR1(preset.R1);
    setR2(preset.R2);
    setC(preset.C);
  };

  const handleCopy = () => {
    if (!outcome.solution) {
      message.warning('暂无可复制的结果');
      return;
    }
    copyToClipboard(toRows(outcome.solution).map((row) => `${row.name}: ${row.display}（${row.formula}）`).join('\n'));
    message.success('结果已复制');
  };

  const fieldCards = [
    { label: '电阻 R1', state: R1, setState: setR1, units: RESISTANCE_UNITS },
    { label: '电阻 R2', state: R2, setState: setR2, units: RESISTANCE_UNITS },
    { label: '电容 C', state: C, setState: setC, units: CAPACITANCE_UNITS },
  ];

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
      render: (text: string) => <Tag className={styles.mono}>{text}</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="555 定时器非稳态频率 / 占空比计算器"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          555 工作于非稳态（多谐振荡器）时，外接 R1、R2、C 决定高 / 低电平时间与振荡频率。经典接法占空比恒大于
          50%；与 2 脚之间串联二极管可实现接近 50% 的对称方波（本计算忽略二极管压降）。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(event) => setMode(event.target.value as Timer555Mode)}
          />
          <span className={styles.hint}>{MODE_OPTIONS.find((option) => option.value === mode)?.hint}</span>
        </div>

        <div className={styles.fieldGrid}>
          {fieldCards.map(({ label, state, setState, units }) => (
            <div key={label} className={styles.fieldCard}>
              <div className={styles.fieldLabel}>{label}</div>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  style={{ flex: 1 }}
                  value={state.value}
                  onChange={(value) => setState({ ...state, value: value === null ? null : Number(value) })}
                />
                <Select
                  style={{ width: 76 }}
                  value={state.unit}
                  onChange={(unit) => setState({ ...state, unit })}
                  options={units.map((option) => ({ label: option.label, value: option.label }))}
                />
              </Space.Compact>
            </div>
          ))}
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <span className={styles.hint}>示例：</span>
          {EXAMPLE_PRESETS.map((preset, index) => (
            <Button key={preset.name} size="small" onClick={() => applyPreset(index)}>
              {preset.name}
            </Button>
          ))}
        </Space>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={outcome.error} />
        ) : null}

        {outcome.solution ? (
          <div style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              columns={columns}
              dataSource={toRows(outcome.solution)}
            />
            {outcome.solution.frequency > MAX_TYPICAL_FREQUENCY ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="超出 NE555 典型工作范围"
                description="双极型 NE555 的最高工作频率通常约 2 MHz（CMOS 版如 7555 可更高）。以上为理想公式理论值，实际还受触发器传输延迟与寄生电容影响。"
              />
            ) : null}
            <Card size="small" style={{ marginTop: 12 }} title="输出方波示意（阈值 ⅓Vcc 与 ⅔Vcc 间充放电）">
              <WaveformSvg solution={outcome.solution} />
            </Card>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default Ne555AstableCalculator;
