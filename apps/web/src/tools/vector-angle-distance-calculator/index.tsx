'use client';

import React from 'react';
import { Alert, Card, Descriptions, InputNumber, Radio, Space, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { AXIS_LABELS, DIMENSION_OPTIONS, RELATION_LABELS, RESULT_PRECISION } from './constants';
import {
  VectorError,
  add,
  angleBetween,
  cross,
  dot,
  magnitude,
  relation,
  scale,
  scalarProjection,
  subtract,
  toDegrees,
  vectorProjection,
  type Vector,
  type VectorDimension,
} from './utils/vector';
import styles from './index.module.css';

type VectorState = [number, number, number];

/**
 * 运算结果：成功时 error 为 null 且携带全部数值字段，失败时仅含 error。
 */
type ComputeResult =
  | {
      error: null;
      magnitudeA: number;
      magnitudeB: number;
      dot: number;
      cross: string;
      angleRad: number;
      angleDeg: number;
      scalarProjection: number;
      vectorProjection: string;
      sum: string;
      difference: string;
      scaled: string;
      relation: keyof typeof RELATION_LABELS;
    }
  | { error: string };

/**
 * 按精度格式化数值，消除 −0 与浮点噪声。
 *
 * @param value - 原始数值
 * @returns 格式化后的数字
 */
function round(value: number): number {
  const rounded = Number(value.toFixed(RESULT_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * 把向量按当前维度截断并格式化展示。
 *
 * @param v - 向量
 * @param dimension - 当前维度
 * @returns 展示字符串
 */
function formatVector(v: Vector, dimension: VectorDimension): string {
  const parts = v.slice(0, dimension).map((component) => round(component).toString());
  return `(${parts.join(', ')})`;
}

/**
 * 二维 / 三维向量运算计算器：模长、点积、叉积、夹角、投影、和差数乘
 * 与正交 / 平行关系判定，全部在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @returns 向量运算交互界面
 */
const VectorAngleDistanceCalculator: React.FC<ToolComponentProps> = () => {
  const [dimension, setDimension] = React.useState<VectorDimension>(2);
  const [vectorA, setVectorA] = React.useState<VectorState>([1, 0, 0]);
  const [vectorB, setVectorB] = React.useState<VectorState>([0, 1, 0]);
  const [scalar, setScalar] = React.useState<number>(2);

  /**
   * 安全执行向量运算，捕获 VectorError 转为错误信息。
   */
  const compute = React.useCallback((): ComputeResult => {
    const a = vectorA.slice(0, dimension) as unknown as Vector;
    const b = vectorB.slice(0, dimension) as unknown as Vector;
    try {
      const angleRad = angleBetween(a, b);
      const crossResult = cross(a, b);
      const relationResult = relation(a, b);
      return {
        error: null,
        magnitudeA: round(magnitude(a)),
        magnitudeB: round(magnitude(b)),
        dot: round(dot(a, b)),
        cross:
          typeof crossResult === 'number'
            ? round(crossResult).toString()
            : formatVector(crossResult, dimension),
        angleRad: round(angleRad),
        angleDeg: round(toDegrees(angleRad)),
        scalarProjection: round(scalarProjection(a, b)),
        vectorProjection: formatVector(vectorProjection(a, b), dimension),
        sum: formatVector(add(a, b), dimension),
        difference: formatVector(subtract(a, b), dimension),
        scaled: formatVector(scale(a, scalar || 0), dimension),
        relation: relationResult,
      };
    } catch (error) {
      return {
        error: error instanceof VectorError ? error.message : '运算失败，请检查输入',
      };
    }
  }, [vectorA, vectorB, dimension, scalar]);

  const result = compute();
  const relationMeta = result.error === null ? RELATION_LABELS[result.relation] : null;

  /**
   * 渲染一组向量分量输入
   */
  const renderVectorInputs = (
    label: string,
    value: VectorState,
    setter: React.Dispatch<React.SetStateAction<VectorState>>,
  ) => (
    <div className={styles.vectorRow}>
      <span className={styles.vectorLabel}>{label}</span>
      {AXIS_LABELS.slice(0, dimension).map((axis, index) => (
        <Space key={axis} size={4}>
          <span className={styles.formula}>{axis} =</span>
          <InputNumber
            className={styles.componentInput}
            value={value[index] ?? 0}
            onChange={(next) => {
              if (next === null || Number.isNaN(next)) {
                return;
              }
              setter((previous) => {
                const updated = [...previous] as VectorState;
                updated[index] = next;
                return updated;
              });
            }}
            step={1}
            precision={undefined}
          />
        </Space>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="二维 / 三维向量运算计算器（点积 · 叉积 · 夹角 · 投影）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={dimension}
            onChange={(event) => setDimension(event.target.value as VectorDimension)}
            options={DIMENSION_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
          />

          {renderVectorInputs('a =', vectorA, setVectorA)}
          {renderVectorInputs('b =', vectorB, setVectorB)}

          <div className={styles.vectorRow}>
            <span className={styles.vectorLabel}>k =</span>
            <span className={styles.formula}>数乘系数（作用于 a）：</span>
            <InputNumber
              className={styles.componentInput}
              value={scalar}
              onChange={(next) => setScalar(next ?? 0)}
              step={1}
            />
          </div>

          {result.error !== null ? (
            <Alert type="error" showIcon message={result.error} />
          ) : (
            <>
              <Descriptions bordered column={2} size="small" title="基础量">
                <Descriptions.Item label="模长 |a|">{result.magnitudeA}</Descriptions.Item>
                <Descriptions.Item label="模长 |b|">{result.magnitudeB}</Descriptions.Item>
                <Descriptions.Item label="点积 a·b">{result.dot}</Descriptions.Item>
                <Descriptions.Item label="叉积 a×b">
                  <span className={styles.formula}>{result.cross}</span>
                </Descriptions.Item>
              </Descriptions>

              <Descriptions bordered column={2} size="small" title="夹角与投影">
                <Descriptions.Item label="夹角 θ（弧度）">{result.angleRad}</Descriptions.Item>
                <Descriptions.Item label="夹角 θ（角度）">{result.angleDeg}°</Descriptions.Item>
                <Descriptions.Item label="标量投影 comp_b(a)">
                  {result.scalarProjection}
                </Descriptions.Item>
                <Descriptions.Item label="向量投影 proj_b(a)">
                  <span className={styles.formula}>{result.vectorProjection}</span>
                </Descriptions.Item>
              </Descriptions>

              <Descriptions bordered column={2} size="small" title="线性运算与关系">
                <Descriptions.Item label="a + b">
                  <span className={styles.formula}>{result.sum}</span>
                </Descriptions.Item>
                <Descriptions.Item label="a − b">
                  <span className={styles.formula}>{result.difference}</span>
                </Descriptions.Item>
                <Descriptions.Item label="k·a">
                  <span className={styles.formula}>{result.scaled}</span>
                </Descriptions.Item>
                <Descriptions.Item label="方向关系">
                  {relationMeta && <Tag color={relationMeta.color}>{relationMeta.label}</Tag>}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          <div className={styles.hint}>
            夹角通过 atan2(|a×b|, a·b) 计算，取值范围 0–180°，数值稳定性优于直接反余弦；
            正交判定容差 1e-10。二维叉积返回标量 z 分量，三维叉积返回向量。
            零向量无法计算夹角、投影或方向关系，会给出明确错误提示。所有运算均在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default VectorAngleDistanceCalculator;
