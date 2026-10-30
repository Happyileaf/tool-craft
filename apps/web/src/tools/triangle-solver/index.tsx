'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Col, Descriptions, InputNumber, Radio, Row, Tag, message } from 'antd';
import {
  formatNum,
  solveTriangle,
  type TriangleInput,
  type TriangleMode,
  type TriangleSolution,
} from './utils/triangle';
import { FIELD_LABELS, MODE_FIELDS, MODE_OPTIONS, SAMPLES } from './constants';
import styles from './index.module.css';

type FieldKey = 'a' | 'b' | 'c' | 'A' | 'B' | 'C';

const ALL_FIELDS: FieldKey[] = ['a', 'b', 'c', 'A', 'B', 'C'];

/** 按求解结果等比绘制的三角形示意（a↔BC、b↔CA、c↔AB） */
const TriangleFigure: React.FC<{ solution: TriangleSolution }> = ({ solution }) => {
  const W = 320;
  const H = 220;
  const PAD = 46;
  const { a, b, c, A: angleA, B: angleB, C: angleC } = solution;
  const longest = Math.max(a, b, c);
  const scale = (W - PAD * 2) / longest;

  // 顶点：B、C 置于底边（a = BC），A 在上方
  const B = { x: PAD + (longest - a) * scale * 0.5, y: H - PAD };
  const C = { x: B.x + a * scale, y: H - PAD };
  // 由 AB = c 及底边夹角 B 定位 A
  const cosB = (a * a + c * c - b * b) / (2 * a * c);
  const sinB = Math.sqrt(Math.max(0, 1 - cosB * cosB));
  const Ax = B.x + c * scale * cosB;
  const Ay = B.y - c * scale * sinB;
  const A = { x: Ax, y: Ay };

  const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 };
  const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.figure} role="img" aria-label="三角形示意图">
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="rgba(22,119,255,0.08)"
        stroke="#1677ff"
        strokeWidth={2}
      />
      <text x={A.x} y={A.y - 10} textAnchor="middle" className={styles.vertexText}>
        A={formatNum(angleA)}°
      </text>
      <text x={B.x - 12} y={B.y + 18} textAnchor="middle" className={styles.vertexText}>
        B={formatNum(angleB)}°
      </text>
      <text x={C.x + 12} y={C.y + 18} textAnchor="middle" className={styles.vertexText}>
        C={formatNum(angleC)}°
      </text>
      <text x={midBC.x} y={midBC.y + 22} textAnchor="middle" className={styles.sideText}>
        a={formatNum(a)}
      </text>
      <text x={midCA.x + 22} y={midCA.y} textAnchor="start" className={styles.sideText}>
        b={formatNum(b)}
      </text>
      <text x={midAB.x - 22} y={midAB.y} textAnchor="end" className={styles.sideText}>
        c={formatNum(c)}
      </text>
    </svg>
  );
};

const TriangleSolver: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<TriangleMode>('SSS');
  const [values, setValues] = React.useState<Record<FieldKey, number | null>>({
    a: 3,
    b: 4,
    c: 5,
    A: null,
    B: null,
    C: null,
  });

  const activeFields = MODE_FIELDS[mode];

  const outcome = React.useMemo<{ error?: string; solutions?: TriangleSolution[]; ambiguous?: boolean }>(
    () => {
      const input: TriangleInput = { mode };
      for (const field of activeFields) {
        const v = values[field as FieldKey];
        if (v === null) return {};
        input[field as FieldKey] = v;
      }
      try {
        const result = solveTriangle(input);
        return { solutions: result.solutions, ambiguous: result.ambiguous };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
    [mode, values, activeFields],
  );

  const applySample = (sample: TriangleInput) => {
    setMode(sample.mode);
    setValues({
      a: sample.a ?? null,
      b: sample.b ?? null,
      c: sample.c ?? null,
      A: sample.A ?? null,
      B: sample.B ?? null,
      C: sample.C ?? null,
    });
  };

  const handleCopy = () => {
    if (!outcome.solutions || outcome.solutions.length === 0) {
      message.warning('暂无可复制的结果');
      return;
    }
    const text = outcome.solutions
      .map((s, i) =>
        [
          outcome.solutions!.length > 1 ? `解 ${i + 1}：` : '',
          `边 a = ${formatNum(s.a)}`,
          `边 b = ${formatNum(s.b)}`,
          `边 c = ${formatNum(s.c)}`,
          `角 A = ${formatNum(s.A)}°`,
          `角 B = ${formatNum(s.B)}°`,
          `角 C = ${formatNum(s.C)}°`,
          `面积 = ${formatNum(s.area)}`,
          `周长 = ${formatNum(s.perimeter)}`,
        ].join('\n'),
      )
      .join('\n\n');
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  return (
    <div className={styles.container}>
      <Card
        title="三角形求解器（SSS / SAS / ASA / AAS / SSA）"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          给定三个独立已知量，自动求出剩余的边、角、面积与周长。约定：边 a、b、c 分别为角 A、B、C
          的对边；角度以度（°）为单位。全部计算在浏览器本地完成。
        </p>

        <div className={styles.fieldLabel}>已知条件类型</div>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(e) => setMode(e.target.value as TriangleMode)}
        />
        <div className={styles.levelHint}>
          {MODE_OPTIONS.find((option) => option.value === mode)?.hint}
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {ALL_FIELDS.map((field) => {
            const enabled = activeFields.includes(field);
            return (
              <Col xs={12} sm={8} md={4} key={field}>
                <div className={styles.fieldLabel}>{FIELD_LABELS[field]}</div>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={4}
                  disabled={!enabled}
                  value={enabled ? values[field] : null}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [field]: value === null ? null : Number(value) }))
                  }
                  placeholder="未使用"
                />
              </Col>
            );
          })}
        </Row>

        <div className={styles.samples}>
          <span className={styles.samplesLabel}>示例：</span>
          {SAMPLES.map((sample) => (
            <Button key={sample.label} size="small" type="link" onClick={() => applySample(sample.input)}>
              {sample.label}
            </Button>
          ))}
        </div>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法求解" description={outcome.error} />
        ) : null}

        {outcome.ambiguous ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="SSA 歧义：存在两个合法三角形"
            description="已知两边及非夹角（SSA）时，第三个顶点可以落在两个不同位置，下列两组解均合法，请按实际场景选择。"
          />
        ) : null}

        {outcome.solutions?.map((solution, index) => (
          <Card
            key={index}
            size="small"
            className={styles.solutionCard}
            title={
              outcome.solutions!.length > 1 ? (
                <Tag color="blue">解 {index + 1}</Tag>
              ) : (
                <Tag color="green">求解成功</Tag>
              )
            }
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Descriptions size="small" bordered column={1}>
                  <Descriptions.Item label="边 a / b / c">
                    <span className={styles.mono}>
                      {formatNum(solution.a)} / {formatNum(solution.b)} / {formatNum(solution.c)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="角 A / B / C">
                    <span className={styles.mono}>
                      {formatNum(solution.A)}° / {formatNum(solution.B)}° / {formatNum(solution.C)}°
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="面积">
                    <span className={styles.mono}>{formatNum(solution.area)}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="周长">
                    <span className={styles.mono}>{formatNum(solution.perimeter)}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <TriangleFigure solution={solution} />
              </Col>
            </Row>
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default TriangleSolver;
