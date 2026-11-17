'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Segmented, Space, Tag } from 'antd';
import { DEFAULT_INPUTS, TOPOLOGY_OPTIONS } from './constants';
import {
  calcDifferential,
  calcInverting,
  calcNonInverting,
  calcSumming,
  formatEngineering,
  recommendResistors,
  type OpAmpTopology,
} from './utils/opamp';
import styles from './index.module.css';

/** 电阻输入框 */
function ResistanceField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="如 10k、100kΩ、2.2M" allowClear />
    </div>
  );
}

/** 电压输入框 */
function VoltageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="如 0.5V、200mV" allowClear />
    </div>
  );
}

/** 结果卡片 */
function ResultCard({ name, value, unit }: { name: string; value: string; unit?: string }) {
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultName}>{name}</div>
      <div className={styles.resultValue}>
        {value}
        {unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

const STROKE = '#1f1f1f';
const RESISTOR_FILL = '#fff7e6';

/** 画一个横向电阻（zigzag 简化为矩形），起点 (x1,y)，终点 (x2,y) */
function resistor(x1: number, x2: number, y: number, label: string, key: string) {
  const width = x2 - x1;
  return (
    <g key={key}>
      <line x1={x1} y1={y} x2={x1 + width * 0.25} y2={y} stroke={STROKE} strokeWidth={1.5} />
      <rect
        x={x1 + width * 0.25}
        y={y - 8}
        width={width * 0.5}
        height={16}
        fill={RESISTOR_FILL}
        stroke={STROKE}
        strokeWidth={1.5}
      />
      <line x1={x1 + width * 0.75} y1={y} x2={x2} y2={y} stroke={STROKE} strokeWidth={1.5} />
      <text x={(x1 + x2) / 2} y={y - 14} textAnchor="middle" fontSize={11} fill="#0958d9">
        {label}
      </text>
    </g>
  );
}

/** 运放三角形符号，尖点朝右，中心 (cx, cy)，高 80 宽 70 */
function opampTriangle(cx: number, cy: number, key: string) {
  const points = `${cx - 35},${cy - 40} ${cx + 35},${cy} ${cx - 35},${cy + 40}`;
  return (
    <g key={key}>
      <polygon points={points} fill="#e6f4ff" stroke={STROKE} strokeWidth={1.5} />
      <text x={cx - 24} y={cy - 14} fontSize={13} fill={STROKE}>
        −
      </text>
      <text x={cx - 24} y={cy + 20} fontSize={13} fill={STROKE}>
        +
      </text>
    </g>
  );
}

/** 四种拓扑的纯 SVG 电路示意图 */
function CircuitDiagram({ topology }: { topology: OpAmpTopology }) {
  const common = { width: 460, height: 260, viewBox: '0 0 460 260' } as const;

  if (topology === 'inverting') {
    return (
      <svg {...common} role="img" aria-label="反相放大器电路示意图">
        <text x={20} y={90} fontSize={12}>Vin</text>
        {resistor(50, 150, 90, 'Rin', 'rin')}
        {opampTriangle(220, 130, 'op')}
        <line x1={150} y1={90} x2={185} y2={90} stroke={STROKE} strokeWidth={1.5} />
        <line x1={185} y1={90} x2={185} y2={110} stroke={STROKE} strokeWidth={1.5} />
        {resistor(185, 340, 60, 'Rf', 'rf')}
        <line x1={255} y1={130} x2={380} y2={130} stroke={STROKE} strokeWidth={1.5} />
        <line x1={340} y1={60} x2={380} y2={60} stroke={STROKE} strokeWidth={1.5} />
        <line x1={380} y1={60} x2={380} y2={130} stroke={STROKE} strokeWidth={1.5} />
        <text x={390} y={134} fontSize={12}>Vout</text>
        <line x1={185} y1={150} x2={185} y2={200} stroke={STROKE} strokeWidth={1.5} />
        <line x1={150} y1={200} x2={220} y2={200} stroke={STROKE} strokeWidth={1.5} />
        <text x={128} y={218} fontSize={11}>接地（虚地）</text>
      </svg>
    );
  }

  if (topology === 'nonInverting') {
    return (
      <svg {...common} role="img" aria-label="同相放大器电路示意图">
        {opampTriangle(220, 130, 'op')}
        <text x={20} y={154} fontSize={12}>Vin</text>
        <line x1={50} y1={150} x2={185} y2={150} stroke={STROKE} strokeWidth={1.5} />
        {resistor(185, 340, 60, 'Rf', 'rf')}
        <line x1={185} y1={60} x2={185} y2={110} stroke={STROKE} strokeWidth={1.5} />
        <line x1={255} y1={130} x2={380} y2={130} stroke={STROKE} strokeWidth={1.5} />
        <line x1={340} y1={60} x2={380} y2={60} stroke={STROKE} strokeWidth={1.5} />
        <line x1={380} y1={60} x2={380} y2={130} stroke={STROKE} strokeWidth={1.5} />
        <text x={390} y={134} fontSize={12}>Vout</text>
        <line x1={185} y1={110} x2={185} y2={200} stroke={STROKE} strokeWidth={1.5} />
        {resistor(120, 250, 200, 'Rg', 'rg')}
        <line x1={185} y1={200} x2={250} y2={200} stroke={STROKE} strokeWidth={1.5} />
        <line x1={250} y1={200} x2={250} y2={225} stroke={STROKE} strokeWidth={1.5} />
        <text x={258} y={220} fontSize={11}>GND</text>
      </svg>
    );
  }

  if (topology === 'summing') {
    return (
      <svg {...common} role="img" aria-label="反相加法器电路示意图">
        <text x={10} y={70} fontSize={11}>V1</text>
        {resistor(40, 160, 70, 'R1', 'r1')}
        <text x={10} y={130} fontSize={11}>V2</text>
        {resistor(40, 160, 130, 'R2', 'r2')}
        {opampTriangle(230, 110, 'op')}
        <line x1={160} y1={70} x2={195} y2={70} stroke={STROKE} strokeWidth={1.5} />
        <line x1={160} y1={130} x2={195} y2={130} stroke={STROKE} strokeWidth={1.5} />
        <line x1={195} y1={70} x2={195} y2={90} stroke={STROKE} strokeWidth={1.5} />
        <circle cx={195} cy={100} r={3} fill={STROKE} />
        <line x1={195} y1={100} x2={195} y2={90} stroke={STROKE} strokeWidth={1.5} />
        {resistor(195, 350, 45, 'Rf', 'rf')}
        <line x1={265} y1={110} x2={400} y2={110} stroke={STROKE} strokeWidth={1.5} />
        <line x1={350} y1={45} x2={400} y2={45} stroke={STROKE} strokeWidth={1.5} />
        <line x1={400} y1={45} x2={400} y2={110} stroke={STROKE} strokeWidth={1.5} />
        <text x={408} y={114} fontSize={12}>Vout</text>
        <line x1={195} y1={130} x2={195} y2={180} stroke={STROKE} strokeWidth={1.5} />
        <text x={150} y={198} fontSize={11}>虚地（求和节点）</text>
      </svg>
    );
  }

  return (
    <svg {...common} role="img" aria-label="差分放大器电路示意图">
      <text x={10} y={80} fontSize={11}>V1</text>
      {resistor(40, 150, 80, 'R1', 'r1')}
      <text x={10} y={180} fontSize={11}>V2</text>
      {resistor(40, 150, 180, 'Rg1', 'rg1')}
      {opampTriangle(220, 120, 'op')}
      <line x1={150} y1={80} x2={185} y2={80} stroke={STROKE} strokeWidth={1.5} />
      <line x1={185} y1={80} x2={185} y2={100} stroke={STROKE} strokeWidth={1.5} />
      <line x1={150} y1={180} x2={185} y2={180} stroke={STROKE} strokeWidth={1.5} />
      <line x1={185} y1={180} x2={185} y2={140} stroke={STROKE} strokeWidth={1.5} />
      {resistor(185, 340, 55, 'Rf', 'rf')}
      <line x1={255} y1={120} x2={390} y2={120} stroke={STROKE} strokeWidth={1.5} />
      <line x1={340} y1={55} x2={390} y2={55} stroke={STROKE} strokeWidth={1.5} />
      <line x1={390} y1={55} x2={390} y2={120} stroke={STROKE} strokeWidth={1.5} />
      <text x={398} y={124} fontSize={12}>Vout</text>
      <line x1={185} y1={180} x2={185} y2={225} stroke={STROKE} strokeWidth={1.5} />
      {resistor(140, 230, 225, 'Rg2', 'rg2')}
      <line x1={230} y1={225} x2={260} y2={225} stroke={STROKE} strokeWidth={1.5} />
      <line x1={260} y1={225} x2={260} y2={245} stroke={STROKE} strokeWidth={1.5} />
      <text x={268} y={240} fontSize={11}>GND</text>
    </svg>
  );
}

/**
 * 运算放大器电路计算器：基于理想运放虚短/虚断模型，
 * 对反相、同相、反相加法、差分四种负反馈拓扑做确定性参数计算。
 *
 * @returns 运放计算器界面
 */
const OpampCalculator: React.FC<ToolComponentProps> = () => {
  const [topology, setTopology] = React.useState<OpAmpTopology>('inverting');
  const [inputs, setInputs] = React.useState<Record<string, string>>({ ...DEFAULT_INPUTS.inverting });
  const [targetGain, setTargetGain] = React.useState('10');

  const patch = (key: string) => (value: string) => setInputs((previous) => ({ ...previous, [key]: value }));

  const switchTopology = (next: OpAmpTopology) => {
    setTopology(next);
    setInputs({ ...DEFAULT_INPUTS[next] });
  };

  /** 当前拓扑计算结果（错误信息由异常捕获） */
  const outcome = React.useMemo<{ error?: string; node?: React.ReactNode }>(() => {
    try {
      if (topology === 'inverting') {
        const result = calcInverting(inputs.vin ?? '', inputs.rin ?? '', inputs.rf ?? '');
        return {
          node: (
            <div className={styles.resultGrid}>
              <ResultCard name="闭环增益 Av" value={formatEngineering(result.gain)} unit="V/V" />
              <ResultCard name="输出电压 Vout" value={formatEngineering(result.vOut)} unit="V" />
              <ResultCard name="输入阻抗 ≈ Rin" value={formatEngineering(result.inputImpedance)} unit="Ω" />
              <ResultCard name="反馈电流 If" value={formatEngineering(result.feedbackCurrent, 3)} unit="A" />
            </div>
          ),
        };
      }
      if (topology === 'nonInverting') {
        const result = calcNonInverting(inputs.vin ?? '', inputs.rg ?? '', inputs.rf ?? '');
        return {
          node: (
            <div className={styles.resultGrid}>
              <ResultCard name="闭环增益 Av" value={formatEngineering(result.gain)} unit="V/V" />
              <ResultCard name="输出电压 Vout" value={formatEngineering(result.vOut)} unit="V" />
              <ResultCard name="反馈支路电流 If" value={formatEngineering(result.feedbackCurrent, 3)} unit="A" />
              <ResultCard name="输入阻抗" value="理想 ≈ ∞" />
            </div>
          ),
        };
      }
      if (topology === 'summing') {
        const result = calcSumming(
          [
            { voltage: inputs.v1 ?? '', resistance: inputs.r1 ?? '' },
            { voltage: inputs.v2 ?? '', resistance: inputs.r2 ?? '' },
          ],
          inputs.rf ?? '',
        );
        return {
          node: (
            <div className={styles.resultGrid}>
              <ResultCard name="输出电压 Vout" value={formatEngineering(result.vOut)} unit="V" />
              <ResultCard name="有效通道数" value={String(result.channelCount)} />
              <ResultCard name="通道 1 电流" value={formatEngineering(result.channelCurrents[0] ?? 0, 3)} unit="A" />
              <ResultCard name="通道 2 电流" value={formatEngineering(result.channelCurrents[1] ?? 0, 3)} unit="A" />
            </div>
          ),
        };
      }
      const result = calcDifferential(
        inputs.v1 ?? '',
        inputs.v2 ?? '',
        inputs.r1 ?? '',
        inputs.rf ?? '',
        inputs.rg1 ?? '',
        inputs.rg2 ?? '',
      );
      return {
        node: (
          <>
            {!result.matched ? (
              <Alert
                style={{ marginBottom: 12 }}
                type="warning"
                showIcon
                message="电阻网络不匹配"
                description={`Rf/R1 与 Rg2/Rg1 偏差约 ${formatEngineering(result.mismatchPercent, 3)}%，共模抑制比（CMRR）下降，结果按通用节点公式计算；精确差分需满足 Rf/R1 = Rg2/Rg1。`}
              />
            ) : (
              <Alert style={{ marginBottom: 12 }} type="success" showIcon message="电阻网络匹配：Rf/R1 = Rg2/Rg1，差分公式成立" />
            )}
            <div className={styles.resultGrid}>
              <ResultCard name="输出电压 Vout" value={formatEngineering(result.vOut)} unit="V" />
              <ResultCard name="差分增益" value={formatEngineering(result.gain)} unit="V/V" />
              <ResultCard name="反馈支路电流 If" value={formatEngineering(result.feedbackCurrent, 3)} unit="A" />
              <ResultCard name="匹配状态" value={result.matched ? '匹配' : '不匹配'} />
            </div>
          </>
        ),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [topology, inputs]);

  /** 增益反推结果 */
  const reverseOutcome = React.useMemo<{ error?: string; text: string }>(() => {
    if (targetGain.trim() === '') return { text: '' };
    const target = Number.parseFloat(targetGain);
    if (Number.isNaN(target)) return { error: '目标增益必须为数字', text: '' };
    try {
      const isInverting = topology === 'inverting';
      const rec = recommendResistors(isInverting ? -Math.abs(target) : Math.abs(target), isInverting ? 'inverting' : 'nonInverting');
      return {
        text: `推荐比值 Rf/${isInverting ? 'Rin' : 'Rg'} = ${formatEngineering(rec.ratio)}；取 ${formatEngineering(
          rec.baseResistance / 1000,
        )}kΩ 基准时，理论反馈电阻 ${formatEngineering(rec.feedbackTarget / 1000)}kΩ，最接近 E24 标称 ${formatEngineering(
          rec.feedbackE24 / 1000,
        )}kΩ，实际增益 ${formatEngineering(rec.achievedGain)}`,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error), text: '' };
    }
  }, [targetGain, topology]);

  const activeMeta = TOPOLOGY_OPTIONS.find((option) => option.value === topology);

  return (
    <div className={styles.container}>
      <Card title="运算放大器电路计算器（理想模型：虚短 / 虚断）">
        <Segmented
          block
          options={TOPOLOGY_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          value={topology}
          onChange={(value) => switchTopology(value as OpAmpTopology)}
        />
        <div style={{ marginTop: 16 }}>
          <Tag color="blue">{activeMeta?.formula}</Tag>
        </div>

        <div className={styles.twoColumn} style={{ marginTop: 16 }}>
          <div>
            <div className={styles.fieldStack}>
              {topology === 'inverting' ? (
                <>
                  <VoltageField label="输入电压 Vin" value={inputs.vin ?? ''} onChange={patch('vin')} />
                  <ResistanceField label="输入电阻 Rin" value={inputs.rin ?? ''} onChange={patch('rin')} />
                  <ResistanceField label="反馈电阻 Rf" value={inputs.rf ?? ''} onChange={patch('rf')} />
                </>
              ) : null}
              {topology === 'nonInverting' ? (
                <>
                  <VoltageField label="同相输入 Vin" value={inputs.vin ?? ''} onChange={patch('vin')} />
                  <ResistanceField label="接地电阻 Rg" value={inputs.rg ?? ''} onChange={patch('rg')} />
                  <ResistanceField label="反馈电阻 Rf" value={inputs.rf ?? ''} onChange={patch('rf')} />
                </>
              ) : null}
              {topology === 'summing' ? (
                <>
                  <ResistanceField label="公共反馈电阻 Rf" value={inputs.rf ?? ''} onChange={patch('rf')} />
                  <div className={styles.channelRow}>
                    <VoltageField label="通道 1 电压 V1" value={inputs.v1 ?? ''} onChange={patch('v1')} />
                    <ResistanceField label="R1" value={inputs.r1 ?? ''} onChange={patch('r1')} />
                  </div>
                  <div className={styles.channelRow}>
                    <VoltageField label="通道 2 电压 V2" value={inputs.v2 ?? ''} onChange={patch('v2')} />
                    <ResistanceField label="R2" value={inputs.r2 ?? ''} onChange={patch('r2')} />
                  </div>
                </>
              ) : null}
              {topology === 'differential' ? (
                <>
                  <div className={styles.channelRow}>
                    <VoltageField label="反相侧 V1" value={inputs.v1 ?? ''} onChange={patch('v1')} />
                    <ResistanceField label="R1" value={inputs.r1 ?? ''} onChange={patch('r1')} />
                  </div>
                  <div className={styles.channelRow}>
                    <VoltageField label="同相侧 V2" value={inputs.v2 ?? ''} onChange={patch('v2')} />
                    <ResistanceField label="Rg1（串接 V2）" value={inputs.rg1 ?? ''} onChange={patch('rg1')} />
                  </div>
                  <div className={styles.channelRow}>
                    <ResistanceField label="反馈 Rf" value={inputs.rf ?? ''} onChange={patch('rf')} />
                    <ResistanceField label="Rg2（同相端接地）" value={inputs.rg2 ?? ''} onChange={patch('rg2')} />
                  </div>
                </>
              ) : null}
            </div>

            <Card size="small" title="由目标增益反推电阻（E24 标称建议）" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  addonBefore={topology === 'inverting' ? '目标增益（负值）' : '目标增益（> 1）'}
                  value={targetGain}
                  onChange={(event) => setTargetGain(event.target.value)}
                />
                {reverseOutcome.error ? <Alert type="error" showIcon message={reverseOutcome.error} /> : null}
                {reverseOutcome.text ? <Alert type="info" showIcon message={reverseOutcome.text} /> : null}
              </Space>
            </Card>
          </div>

          <div>
            <div className={styles.svgWrap}>
              <CircuitDiagram topology={topology} />
            </div>
            <div style={{ marginTop: 16 }}>
              {outcome.error ? <Alert type="error" showIcon message="输入不合法" description={outcome.error} /> : outcome.node}
            </div>
          </div>
        </div>

        <p className={styles.hint} style={{ marginTop: 16 }}>
          电阻支持 Ω/kΩ/MΩ 后缀（如 10k、2.2M），电压支持 V/mV 后缀；全部计算在本地完成，基于理想运放模型，未考虑失调电压、压摆率与带宽限制。
        </p>
      </Card>
    </div>
  );
};

export default OpampCalculator;
