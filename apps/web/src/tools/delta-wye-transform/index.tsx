'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import {
  deltaToWye,
  wyeToDelta,
  isBalanced,
  parseResistance,
  type TransformDirection,
  type DeltaResistors,
  type WyeResistors,
} from './utils/deltaWye';
import { DIRECTION_OPTIONS, EXAMPLE_PRESETS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Triple = [string, string, string];

function formatOhm(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1e6) return `${trim(value / 1e6)} MΩ`;
  if (value >= 1e3) return `${trim(value / 1e3)} kΩ`;
  return `${trim(value)} Ω`;
}

function trim(value: number): string {
  return Number(value.toFixed(6)).toString();
}

/** 三角形网络示意（端子 A 上、B 左下、C 右下） */
function DeltaDiagram({ labels }: { labels: [string, string, string] }) {
  const points = '100,18 26,138 174,138';
  return (
    <svg width="100%" viewBox="0 0 200 160" role="img" aria-label="三角形（Δ）网络示意">
      <polygon points={points} fill="none" stroke="#1677ff" strokeWidth={2} />
      <circle cx="100" cy="18" r="4" fill="#1677ff" />
      <circle cx="26" cy="138" r="4" fill="#1677ff" />
      <circle cx="174" cy="138" r="4" fill="#1677ff" />
      <text x="100" y="12" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.75)">A</text>
      <text x="18" y="152" fontSize="12" fill="rgba(0,0,0,0.75)">B</text>
      <text x="176" y="152" fontSize="12" fill="rgba(0,0,0,0.75)">C</text>
      <text x="50" y="72" fontSize="11" fill="rgba(0,0,0,0.65)">{labels[0]}</text>
      <text x="132" y="72" fontSize="11" fill="rgba(0,0,0,0.65)">{labels[2]}</text>
      <text x="86" y="134" fontSize="11" fill="rgba(0,0,0,0.65)">{labels[1]}</text>
    </svg>
  );
}

/** 星形网络示意（中心节点 N，端子 A 上、B 左下、C 右下） */
function WyeDiagram({ labels }: { labels: [string, string, string] }) {
  const center = { x: 100, y: 86 };
  const terminals = [
    { x: 100, y: 18, tag: 'A', label: labels[0], lx: 108, ly: 48 },
    { x: 26, y: 138, tag: 'B', label: labels[1], lx: 44, ly: 118 },
    { x: 174, y: 138, tag: 'C', label: labels[2], lx: 132, ly: 118 },
  ];
  return (
    <svg width="100%" viewBox="0 0 200 160" role="img" aria-label="星形（Y）网络示意">
      {terminals.map((t) => (
        <line key={t.tag} x1={center.x} y1={center.y} x2={t.x} y2={t.y} stroke="#1677ff" strokeWidth={2} />
      ))}
      {terminals.map((t) => (
        <circle key={t.tag} cx={t.x} cy={t.y} r="4" fill="#1677ff" />
      ))}
      <circle cx={center.x} cy={center.y} r="5" fill="#fff" stroke="#1677ff" strokeWidth={2} />
      <text x={center.x + 9} y={center.y + 4} fontSize="11" fill="rgba(0,0,0,0.75)">N</text>
      {terminals.map((t) => (
        <text
          key={`${t.tag}-t`}
          x={t.x + (t.tag === 'A' ? 0 : t.tag === 'B' ? -8 : 6)}
          y={t.tag === 'A' ? 12 : 152}
          fontSize="12"
          fill="rgba(0,0,0,0.75)"
        >
          {t.tag}
        </text>
      ))}
      {terminals.map((t) => (
        <text key={`${t.tag}-l`} x={t.lx} y={t.ly} fontSize="11" fill="rgba(0,0,0,0.65)">
          {t.label}
        </text>
      ))}
    </svg>
  );
}

const DELTA_FIELDS = ['R_AB（AB 边）', 'R_BC（BC 边）', 'R_CA（CA 边）'] as const;
const WYE_FIELDS = ['R_A（A 臂）', 'R_B（B 臂）', 'R_C（C 臂）'] as const;

const DeltaWyeTransform: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = React.useState<TransformDirection>('delta-to-wye');
  const [deltaText, setDeltaText] = React.useState<Triple>(['30', '30', '30']);
  const [wyeText, setWyeText] = React.useState<Triple>(['10', '10', '10']);

  const outcome = React.useMemo<{
    result?: DeltaResistors | WyeResistors;
    error?: string;
  }>(() => {
    try {
      if (direction === 'delta-to-wye') {
        const parsed = deltaText.map((value, index) =>
          parseResistance(value, DELTA_FIELDS[index] ?? `R${index}`),
        );
        const rab = parsed[0] ?? 0;
        const rbc = parsed[1] ?? 0;
        const rca = parsed[2] ?? 0;
        return { result: deltaToWye({ rab, rbc, rca }) };
      }
      const parsed = wyeText.map((value, index) =>
        parseResistance(value, WYE_FIELDS[index] ?? `R${index}`),
      );
      const ra = parsed[0] ?? 0;
      const rb = parsed[1] ?? 0;
      const rc = parsed[2] ?? 0;
      return { result: wyeToDelta({ ra, rb, rc }) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [direction, deltaText, wyeText]);

  const applyPreset = (index: number) => {
    const preset = EXAMPLE_PRESETS[index];
    if (!preset) return;
    setDirection(preset.direction);
    setDeltaText([String(preset.delta.rab), String(preset.delta.rbc), String(preset.delta.rca)]);
    setWyeText([
      trim(preset.wye.ra),
      trim(preset.wye.rb),
      trim(preset.wye.rc),
    ]);
  };

  const sourceTriple: Triple = direction === 'delta-to-wye' ? deltaText : wyeText;
  const setSourceTriple = direction === 'delta-to-wye' ? setDeltaText : setWyeText;
  const sourceFields = direction === 'delta-to-wye' ? DELTA_FIELDS : WYE_FIELDS;

  const rows = React.useMemo(() => {
    if (!outcome.result) return [];
    if (direction === 'delta-to-wye') {
      const r = outcome.result as WyeResistors;
      return [
        { key: 'ra', name: 'R_A（A → 中心 N）', value: r.ra, formula: 'R_AB·R_CA / (R_AB+R_BC+R_CA)' },
        { key: 'rb', name: 'R_B（B → 中心 N）', value: r.rb, formula: 'R_AB·R_BC / (R_AB+R_BC+R_CA)' },
        { key: 'rc', name: 'R_C（C → 中心 N）', value: r.rc, formula: 'R_BC·R_CA / (R_AB+R_BC+R_CA)' },
      ];
    }
    const r = outcome.result as DeltaResistors;
    return [
      { key: 'rab', name: 'R_AB（AB 边）', value: r.rab, formula: '(R_A·R_B+R_B·R_C+R_C·R_A) / R_C' },
      { key: 'rbc', name: 'R_BC（BC 边）', value: r.rbc, formula: '(R_A·R_B+R_B·R_C+R_C·R_A) / R_A' },
      { key: 'rca', name: 'R_CA（CA 边）', value: r.rca, formula: '(R_A·R_B+R_B·R_C+R_C·R_A) / R_B' },
    ];
  }, [direction, outcome.result]);

  const balanced = outcome.result ? isBalanced(rows.map((row) => row.value)) : false;

  const handleCopy = () => {
    if (!outcome.result) {
      message.warning('暂无可复制的结果');
      return;
    }
    copyToClipboard(rows.map((row) => `${row.name}: ${formatOhm(row.value)}（${row.formula}）`).join('\n'));
    message.success('结果已复制');
  };

  const columns = [
    { title: '结果量', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => <span className={styles.mono}>{formatOhm(value)}</span>,
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
        title="Δ-Y（三角形-星形）电阻网络双向等效变换计算器"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          三个端子 A、B、C 之间，Δ（三角形）三边电阻与 Y（星形）三臂电阻可互相等效变换：端子间等效电阻完全相同。
          平衡网络满足 R_Y = R_Δ / 3。输入支持纯数字与 k / M 后缀（如 1k、2.2kΩ、4.7M），全部计算在浏览器本地完成。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            options={DIRECTION_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(event) => setDirection(event.target.value as TransformDirection)}
          />
          <span className={styles.hint}>
            {DIRECTION_OPTIONS.find((option) => option.value === direction)?.hint}
          </span>
        </div>

        <div className={styles.fieldGrid}>
          {sourceFields.map((label, index) => (
            <div key={label} className={styles.fieldCard}>
              <div className={styles.fieldLabel}>{label}</div>
              <Input
                placeholder="如 330、1k、2.2kΩ、4.7M"
                value={sourceTriple[index]}
                onChange={(event) => {
                  const next = [...sourceTriple] as Triple;
                  next[index] = event.target.value;
                  setSourceTriple(next);
                }}
              />
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
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法变换" description={outcome.error} />
        ) : null}

        {outcome.result ? (
          <div style={{ marginTop: 16 }}>
            <Table size="small" pagination={false} columns={columns} dataSource={rows} />
            {balanced ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="平衡网络"
                description="三个电阻相等，属于平衡网络，满足 R_Y = R_Δ / 3（Δ→Y）或 R_Δ = 3·R_Y（Y→Δ）。"
              />
            ) : null}
            <Card size="small" style={{ marginTop: 12 }} title="网络结构示意（左：输入侧；右：等效侧）">
              <div className={styles.fieldGrid}>
                {direction === 'delta-to-wye' ? (
                  <>
                    <DeltaDiagram labels={['R_AB', 'R_BC', 'R_CA']} />
                    <WyeDiagram labels={['R_A', 'R_B', 'R_C']} />
                  </>
                ) : (
                  <>
                    <WyeDiagram labels={['R_A', 'R_B', 'R_C']} />
                    <DeltaDiagram labels={['R_AB', 'R_BC', 'R_CA']} />
                  </>
                )}
              </div>
            </Card>
            <div className={styles.formulaBox} style={{ marginTop: 12 }}>
              <span className={styles.mono}>
                Δ → Y：R_A = R_AB·R_CA / S，R_B = R_AB·R_BC / S，R_C = R_BC·R_CA / S，其中 S = R_AB + R_BC + R_CA
              </span>
              <span className={styles.mono}>
                Y → Δ：R_AB = P / R_C，R_BC = P / R_A，R_CA = P / R_B，其中 P = R_A·R_B + R_B·R_C + R_C·R_A
              </span>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default DeltaWyeTransform;
