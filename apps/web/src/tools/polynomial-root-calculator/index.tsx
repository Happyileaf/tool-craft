'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Col, Descriptions, InputNumber, Radio, Row, Tag, message } from 'antd';
import {
  formatComplex,
  formatNum,
  solvePolynomial,
  type PolynomialInput,
  type PolynomialMode,
  type PolynomialResult,
  type PolynomialRoot,
} from './utils/polynomial';
import { FIELD_LABELS, MODE_OPTIONS, SAMPLES } from './constants';
import styles from './index.module.css';

type CoeffKey = 'a' | 'b' | 'c' | 'd';
type CoeffState = Record<CoeffKey, number | null>;

const DEFAULT_COEFF: CoeffState = { a: 1, b: -5, c: 6, d: null };

/** 组合当前方程的可读形式，如 x² − 5x + 6 = 0 */
function buildEquation(mode: PolynomialMode, coeff: CoeffState): string {
  const degrees = mode === 'cubic' ? [3, 2, 1, 0] : [2, 1, 0];
  const keys: CoeffKey[] = mode === 'cubic' ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c'];
  const parts: string[] = [];
  degrees.forEach((degree, index) => {
    const value = coeff[keys[index]!];
    if (value === null || value === 0) return;
    const sign = value < 0 ? '−' : '+';
    const magnitude = Math.abs(value) === 1 && degree > 0 ? '' : formatNum(Math.abs(value));
    const variable = degree === 0 ? '' : degree === 1 ? 'x' : `x${degree === 2 ? '²' : '³'}`;
    parts.push(`${sign} ${magnitude}${variable}`);
  });
  if (parts.length === 0) return '0 = 0';
  let text = parts.join(' ');
  if (text.startsWith('+ ')) text = text.slice(2);
  return `${text} = 0`;
}

/** 复平面根分布图：实轴/虚轴 + 全部根（计重数标注） */
const RootPlot: React.FC<{ roots: PolynomialRoot[] }> = ({ roots }) => {
  const W = 320;
  const H = 260;
  const PAD = 40;
  const maxAxis = Math.max(
    1,
    ...roots.map((r) => Math.max(Math.abs(r.re), Math.abs(r.im))),
  );
  const range = maxAxis * 1.25;
  const unit = Math.min((W / 2 - PAD) / range, (H / 2 - PAD) / range);
  const mapX = (re: number) => W / 2 + re * unit;
  const mapY = (im: number) => H / 2 - im * unit;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.figure} role="img" aria-label="根在复平面上的分布">
      {/* 实轴与虚轴 */}
      <line x1={PAD / 2} y1={H / 2} x2={W - PAD / 2} y2={H / 2} stroke="#d9d9d9" strokeWidth={1} />
      <line x1={W / 2} y1={PAD / 2} x2={W / 2} y2={H - PAD / 2} stroke="#d9d9d9" strokeWidth={1} />
      <text x={W - PAD / 2 + 4} y={H / 2 - 6} className={styles.axisText}>
        Re
      </text>
      <text x={W / 2 + 6} y={PAD / 2 + 4} className={styles.axisText}>
        Im
      </text>
      <text x={W / 2 + 4} y={H / 2 + 14} className={styles.axisText}>
        0
      </text>
      {roots.map((root, index) => {
        const isReal = root.im === 0;
        const color = isReal ? '#52c41a' : '#722ed1';
        return (
          <g key={index}>
            <circle cx={mapX(root.re)} cy={mapY(root.im)} r={5} fill={color} />
            <text
              x={mapX(root.re)}
              y={mapY(root.im) - 10}
              textAnchor="middle"
              className={isReal ? styles.realText : styles.complexText}
            >
              {formatComplex(root)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const PolynomialRootCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<PolynomialMode>('quadratic');
  const [coeff, setCoeff] = React.useState<CoeffState>(DEFAULT_COEFF);

  const fields: CoeffKey[] = mode === 'cubic' ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c'];

  const outcome = React.useMemo<{ error?: string; result?: PolynomialResult }>(() => {
    for (const key of fields) {
      if (coeff[key] === null) return {};
    }
    const input: PolynomialInput =
      mode === 'cubic'
        ? { mode, a: coeff.a!, b: coeff.b!, c: coeff.c!, d: coeff.d! }
        : { mode, a: coeff.a!, b: coeff.b!, c: coeff.c! };
    try {
      return { result: solvePolynomial(input) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [mode, coeff, fields]);

  const applySample = (sample: (typeof SAMPLES)[number]) => {
    setMode(sample.mode);
    setCoeff({ a: sample.a, b: sample.b, c: sample.c, d: sample.d });
  };

  const handleCopy = () => {
    if (!outcome.result) {
      message.warning('暂无可复制的结果');
      return;
    }
    const { result } = outcome;
    const lines = [
      buildEquation(mode, coeff),
      `实际次数：${result.degree}`,
      result.discriminant === null ? '' : `判别式 Δ = ${formatNum(result.discriminant)}`,
      '全部根（计重数）：',
      ...result.roots.map((root, index) => `  x${index + 1} = ${formatComplex(root)}`),
    ].filter(Boolean);
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  return (
    <div className={styles.container}>
      <Card
        title="一元二次 / 三次方程求根计算器"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          按高次项到常数项输入系数（无该项填 0，首项为 0 时自动降次），输出全部实根与复根、判别式、求解步骤与根的重数。全部计算在浏览器本地完成。
        </p>

        <div className={styles.fieldLabel}>方程类型</div>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(e) => {
            const next = e.target.value as PolynomialMode;
            setMode(next);
            setCoeff((prev) =>
              next === 'cubic' ? { ...prev, d: prev.d ?? 0 } : { a: prev.a, b: prev.b, c: prev.c, d: null },
            );
          }}
        />
        <div className={styles.levelHint}>
          {MODE_OPTIONS.find((option) => option.value === mode)?.hint}
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {fields.map((key) => (
            <Col xs={12} sm={6} md={mode === 'cubic' ? 6 : 8} key={key}>
              <div className={styles.fieldLabel}>{FIELD_LABELS[key]}</div>
              <InputNumber
                style={{ width: '100%' }}
                step={1}
                value={coeff[key]}
                onChange={(value) =>
                  setCoeff((prev) => ({ ...prev, [key]: value === null ? null : Number(value) }))
                }
                placeholder="请输入系数"
              />
            </Col>
          ))}
        </Row>

        <div className={styles.equation}>{buildEquation(mode, coeff)}</div>

        <div className={styles.samples}>
          <span className={styles.samplesLabel}>示例：</span>
          {SAMPLES.map((sample) => (
            <Button key={sample.label} size="small" type="link" onClick={() => applySample(sample)}>
              {sample.label}
            </Button>
          ))}
        </div>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法求解" description={outcome.error} />
        ) : null}

        {outcome.result ? (
          <Card size="small" className={styles.solutionCard} title={<Tag color="green">求解成功</Tag>}>
            <Row gutter={16}>
              <Col xs={24} md={13}>
                <Descriptions size="small" bordered column={1}>
                  <Descriptions.Item label="实际次数">
                    <span className={styles.mono}>{outcome.result.degree} 次</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="判别式 Δ">
                    <span className={styles.mono}>
                      {outcome.result.discriminant === null
                        ? '—（一次方程）'
                        : formatNum(outcome.result.discriminant)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="全部根（计重数）">
                    <span className={styles.mono}>
                      {outcome.result.roots.map((root, index) => (
                        <Tag
                          key={index}
                          color={root.im === 0 ? 'green' : 'purple'}
                          className={styles.rootTag}
                        >
                          x{index + 1} = {formatComplex(root)}
                        </Tag>
                      ))}
                    </span>
                  </Descriptions.Item>
                </Descriptions>

                <ol className={styles.stepList}>
                  {outcome.result.steps.map((step, index) => (
                    <li key={index}>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <div className={styles.mono}>{step.detail}</div>
                    </li>
                  ))}
                </ol>
              </Col>
              <Col xs={24} md={11}>
                <RootPlot roots={outcome.result.roots} />
              </Col>
            </Row>
          </Card>
        ) : null}
      </Card>
    </div>
  );
};

export default PolynomialRootCalculator;
