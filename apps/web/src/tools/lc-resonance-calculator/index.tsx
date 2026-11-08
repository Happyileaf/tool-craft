'use client';

import React from 'react';
import { Alert, Button, Card, Form, InputNumber, Radio, Select, Space, Table, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  toSi,
  resonantFrequency,
  inductanceForFrequency,
  capacitanceForFrequency,
  inductiveReactance,
  capacitiveReactance,
  pickEngineeringUnit,
  INDUCTANCE_UNITS,
  CAPACITANCE_UNITS,
  FREQUENCY_UNITS,
  STANDARD_LC_PAIRS,
} from './utils/lc';
import { LC_MODES, LC_PRESETS, type LcMode } from './constants';
import styles from './index.module.css';

/** 把工程值格式化为带单位的字符串，保留合理有效数字 */
function formatEngineering(
  siValue: number,
  unitMap: Record<string, number>,
  fractionDigits = 4,
): string {
  const picked = pickEngineeringUnit(siValue, unitMap);
  return `${picked.value.toPrecision(fractionDigits).replace(/\.?0+$/, '')} ${picked.unit}`;
}

/**
 * LC 谐振频率与电抗计算器：支持 f₀/L/C 三者互求、谐振点电抗核对，
 * 并给出常用标准 L/C 组合的谐振频率参考，全部本地浮点运算。
 */
const LcResonanceCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<LcMode>('f0');
  const [lValue, setLValue] = React.useState(100);
  const [lUnit, setLUnit] = React.useState('µH');
  const [cValue, setCValue] = React.useState(100);
  const [cUnit, setCUnit] = React.useState('pF');
  const [fValue, setFValue] = React.useState(1);
  const [fUnit, setFUnit] = React.useState('MHz');

  const siL = React.useMemo(() => toSi(lValue || 0, lUnit, INDUCTANCE_UNITS), [lValue, lUnit]);
  const siC = React.useMemo(() => toSi(cValue || 0, cUnit, CAPACITANCE_UNITS), [cValue, cUnit]);
  const siF = React.useMemo(() => toSi(fValue || 0, fUnit, FREQUENCY_UNITS), [fValue, fUnit]);

  const output = React.useMemo<{ error?: string; f0?: number; solvedL?: number; solvedC?: number }>(
    () => {
      try {
        if (mode === 'f0') {
          return { f0: resonantFrequency(siL, siC) };
        }
        if (mode === 'solveL') {
          return { solvedL: inductanceForFrequency(siF, siC) };
        }
        return { solvedC: capacitanceForFrequency(siF, siL) };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
    [mode, siL, siC, siF],
  );

  /** 谐振点处的感抗与容抗（仅 f0 模式直接可算） */
  const resonanceCheck = React.useMemo(() => {
    if (mode !== 'f0' || output.error || output.f0 === undefined) {
      return null;
    }
    const xl = inductiveReactance(output.f0, siL);
    const xc = capacitiveReactance(output.f0, siC);
    return { xl, xc };
  }, [mode, output, siL, siC]);

  const standardRows = React.useMemo(
    () =>
      STANDARD_LC_PAIRS.map((pair) => ({
        key: pair.label,
        label: pair.label,
        f0: resonantFrequency(pair.inductanceH, pair.capacitanceF),
      })),
    [],
  );

  const unitSelect = (
    value: string,
    options: string[],
    onChange: (unit: string) => void,
  ) => (
    <Select style={{ width: 90 }} value={value} onChange={onChange} options={options.map((u) => ({ value: u, label: u }))} />
  );

  return (
    <div className={styles.container}>
      <Card title="LC 谐振频率与电抗计算器">
        <p className={styles.hint}>
          理想 LC 谐振关系 f₀ = 1 / (2π√(LC))，谐振点感抗 Xl = 2πfL 与容抗 Xc = 1/(2πfC) 大小相等、符号相反。
          所有计算在浏览器本地完成，忽略元件 ESR、寄生参数与分布电容。
        </p>

        <div className={styles.modeBar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={LC_MODES.map((item) => ({ value: item.value, label: item.label }))}
            onChange={(event) => setMode(event.target.value as LcMode)}
          />
        </div>

        <Space wrap style={{ marginBottom: 16 }}>
          {LC_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              onClick={() => {
                setMode('f0');
                setLValue(preset.l);
                setLUnit(preset.lUnit);
                setCValue(preset.c);
                setCUnit(preset.cUnit);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Space>

        <div className={styles.fieldGrid}>
          {mode !== 'solveL' ? (
            <Form layout="vertical">
              <Form.Item label={mode === 'solveC' ? '已知电感 L' : '电感 L'}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={lValue}
                  onChange={(v) => setLValue(Number(v ?? 0))}
                  addonAfter={unitSelect(lUnit, ['H', 'mH', 'µH', 'nH'], setLUnit)}
                />
              </Form.Item>
            </Form>
          ) : null}

          {mode !== 'solveC' ? (
            <Form layout="vertical">
              <Form.Item label={mode === 'solveL' ? '已知电容 C' : '电容 C'}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={cValue}
                  onChange={(v) => setCValue(Number(v ?? 0))}
                  addonAfter={unitSelect(cUnit, ['F', 'mF', 'µF', 'nF', 'pF'], setCUnit)}
                />
              </Form.Item>
            </Form>
          ) : null}

          {mode !== 'f0' ? (
            <Form layout="vertical">
              <Form.Item label="目标谐振频率 f₀">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={fValue}
                  onChange={(v) => setFValue(Number(v ?? 0))}
                  addonAfter={unitSelect(fUnit, ['Hz', 'kHz', 'MHz', 'GHz'], setFUnit)}
                />
              </Form.Item>
            </Form>
          ) : null}
        </div>

        {output.error ? (
          <Alert type="warning" showIcon message={output.error} />
        ) : (
          <div className={styles.statGrid} style={{ marginTop: 8 }}>
            {output.f0 !== undefined ? (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>谐振频率 f₀</div>
                <div className={styles.statValue}>{formatEngineering(output.f0, FREQUENCY_UNITS)}</div>
                <div className={styles.hint}>{output.f0.toExponential(4)} Hz</div>
              </div>
            ) : null}
            {output.solvedL !== undefined ? (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>所需电感 L</div>
                <div className={styles.statValue}>{formatEngineering(output.solvedL, INDUCTANCE_UNITS)}</div>
                <div className={styles.hint}>{output.solvedL.toExponential(4)} H</div>
              </div>
            ) : null}
            {output.solvedC !== undefined ? (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>所需电容 C</div>
                <div className={styles.statValue}>{formatEngineering(output.solvedC, CAPACITANCE_UNITS)}</div>
                <div className={styles.hint}>{output.solvedC.toExponential(4)} F</div>
              </div>
            ) : null}
            {resonanceCheck ? (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>谐振点感抗 Xl</div>
                  <div className={`${styles.statValue} ${styles.mono}`}>{resonanceCheck.xl.toPrecision(5)} Ω</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>谐振点容抗 Xc</div>
                  <div className={`${styles.statValue} ${styles.mono}`}>{resonanceCheck.xc.toPrecision(5)} Ω</div>
                  <div className={styles.hint}>
                    <Tag color="green">Xl ≈ Xc，净电抗为 0</Tag>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        <Card size="small" title="常用标准 L/C 组合谐振频率参考" style={{ marginTop: 16 }}>
          <Table
            size="small"
            pagination={false}
            dataSource={standardRows}
            columns={[
              { title: '组合', dataIndex: 'label', key: 'label', render: (v: string) => <span className={styles.mono}>{v}</span> },
              {
                title: 'f₀',
                dataIndex: 'f0',
                key: 'f0',
                render: (v: number) => <span className={styles.mono}>{formatEngineering(v, FREQUENCY_UNITS)}</span>,
              },
            ]}
          />
        </Card>
      </Card>
    </div>
  );
};

export default LcResonanceCalculator;
