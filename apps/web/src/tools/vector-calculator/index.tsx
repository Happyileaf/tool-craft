'use client';

import { useState } from 'react';
import { Alert, Button, InputNumber, Radio, Space, Typography } from 'antd';
import {
  add,
  subtract,
  scale,
  dot,
  cross,
  magnitude,
  normalize,
  angleDegrees,
  angleRadians,
  scalarProjection,
  vectorProjection,
  roundVector,
  roundScalar,
  type Vector,
} from './utils/vector';
import { VECTOR_TOOL_I18N as T } from './constants';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;

type AngleUnit = 'degree' | 'radian';

interface ResultItem {
  label: string;
  value: string;
  isError?: boolean;
}

function formatVector(v: Vector): string {
  return `(${roundVector(v).join(', ')})`;
}

/** 安全执行：捕获错误并返回错误信息，避免界面出现 NaN */
function safeRun(label: string, fn: () => string): ResultItem {
  try {
    return { label, value: fn() };
  } catch (error) {
    return {
      label,
      value: error instanceof Error ? error.message : String(error),
      isError: true,
    };
  }
}

export default function VectorCalculator() {
  const [dimension, setDimension] = useState<2 | 3>(3);
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('degree');
  const [a, setA] = useState<Vector>([1, 2, 3]);
  const [b, setB] = useState<Vector>([4, 5, 6]);
  const [scalarK, setScalarK] = useState<number>(2);
  const [results, setResults] = useState<ResultItem[] | null>(null);

  const componentTags = dimension === 3 ? [T.componentX, T.componentY, T.componentZ] : [T.componentX, T.componentY];

  const updateComponent = (
    setter: React.Dispatch<React.SetStateAction<Vector>>,
    current: Vector,
    index: number,
    value: number | null,
  ) => {
    const next = [...current];
    next[index] = value ?? 0;
    setter(next);
  };

  const handleDimensionChange = (nextDimension: 2 | 3) => {
    setDimension(nextDimension);
    setResults(null);
    if (nextDimension === 2) {
      setA((prev) => [prev[0] ?? 0, prev[1] ?? 0]);
      setB((prev) => [prev[0] ?? 0, prev[1] ?? 0]);
    } else {
      setA((prev) => [prev[0] ?? 0, prev[1] ?? 0, prev[2] ?? 0]);
      setB((prev) => [prev[0] ?? 0, prev[1] ?? 0, prev[2] ?? 0]);
    }
  };

  const handleCalculate = () => {
    const items: ResultItem[] = [
      safeRun(`${T.magnitude}：A`, () => String(roundScalar(magnitude(a)))),
      safeRun(`${T.magnitude}：B`, () => String(roundScalar(magnitude(b)))),
      safeRun(T.unitVector + ' A', () => formatVector(normalize(a))),
      safeRun(T.unitVector + ' B', () => formatVector(normalize(b))),
      safeRun(T.sum, () => formatVector(add(a, b))),
      safeRun(T.difference, () => formatVector(subtract(a, b))),
      safeRun(T.scaling, () => formatVector(scale(a, scalarK))),
      safeRun(T.dotProduct, () => String(roundScalar(dot(a, b)))),
    ];

    if (dimension === 3) {
      items.push(safeRun(T.crossProduct, () => formatVector(cross(a, b))));
    } else {
      items.push({ label: T.crossProduct, value: T.crossDisabled2d, isError: true });
    }

    items.push(
      safeRun(T.angle, () =>
        angleUnit === 'degree'
          ? `${roundScalar(angleDegrees(a, b))}°`
          : `${roundScalar(angleRadians(a, b))} rad`,
      ),
      safeRun(T.scalarProj, () => String(roundScalar(scalarProjection(a, b)))),
      safeRun(T.vectorProj, () => formatVector(vectorProjection(a, b))),
    );

    setResults(items);
  };

  const handleReset = () => {
    setDimension(3);
    setA([1, 2, 3]);
    setB([4, 5, 6]);
    setScalarK(2);
    setAngleUnit('degree');
    setResults(null);
  };

  const renderVectorInputs = (
    label: string,
    values: Vector,
    setter: React.Dispatch<React.SetStateAction<Vector>>,
  ) => (
    <div className={styles.vectorRow}>
      <span className={styles.vectorName}>{label}</span>
      <div className={styles.componentInputs}>
        {componentTags.map((tag, index) => (
          <div className={styles.component} key={tag}>
            <span className={styles.componentTag}>{tag}</span>
            <InputNumber
              value={values[index]}
              onChange={(value) => updateComponent(setter, values, index, value)}
              style={{ width: 120 }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          {T.title}
        </Title>
        <Paragraph className={styles.subtitle}>{T.subtitle}</Paragraph>
      </div>

      <div className={styles.panel}>
        <div className={styles.controls}>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>{T.dimensionLabel}</span>
            <Radio.Group
              value={dimension}
              onChange={(event) => handleDimensionChange(event.target.value as 2 | 3)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value={2}>{T.dim2d}</Radio.Button>
              <Radio.Button value={3}>{T.dim3d}</Radio.Button>
            </Radio.Group>
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>{T.angleUnitLabel}</span>
            <Radio.Group
              value={angleUnit}
              onChange={(event) => setAngleUnit(event.target.value as AngleUnit)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="degree">{T.unitDegree}</Radio.Button>
              <Radio.Button value="radian">{T.unitRadian}</Radio.Button>
            </Radio.Group>
          </div>
          <div className={styles.controlItem}>
            <span className={styles.controlLabel}>{T.scalarLabel}</span>
            <InputNumber value={scalarK} onChange={(value) => setScalarK(value ?? 0)} style={{ width: 120 }} />
          </div>
        </div>

        {renderVectorInputs('A', a, setA)}
        {renderVectorInputs('B', b, setB)}

        <Space className={styles.actions}>
          <Button type="primary" onClick={handleCalculate}>
            {T.calculate}
          </Button>
          <Button onClick={handleReset}>{T.reset}</Button>
        </Space>
      </div>

      {results && (
        <div className={styles.resultGrid}>
          {results.map((item) => (
            <div className={styles.resultCard} key={item.label}>
              <Text className={styles.resultLabel}>{item.label}</Text>
              <span className={`${styles.resultValue} ${item.isError ? styles.resultValueError : ''}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {dimension === 2 && (
        <Alert type="info" showIcon message={T.crossDisabled2d} />
      )}
    </div>
  );
}
