'use client';

import { Alert, Card, InputNumber, Radio, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import {
  DEFAULT_DISTANCE_POINT,
  DEFAULT_POINT_1,
  DEFAULT_POINT_2,
  DEFAULT_SECOND_LINE,
  DEFAULT_SECOND_POINT_3,
  DEFAULT_SECOND_POINT_4,
  DISTANCE_LINE_TARGETS,
  LINE_INPUT_MODES,
} from './constants';
import {
  distanceBetweenPoints,
  distancePointToLine,
  footOfPerpendicular,
  formatDecimal,
  formatExact,
  formatGeneralForm,
  formatPointSlope,
  formatSlopeIntercept,
  intersection,
  lineFromGeneral,
  lineRelation,
  lineThroughPoints,
  midpoint,
  perpendicularLineThrough,
  slopeOfLine,
} from './utils/geometry';
import type { Line, LineRelation, Point } from './utils/geometry';
import styles from './index.module.css';

type SecondLineMode = (typeof LINE_INPUT_MODES)[number]['value'];
type DistanceLineTarget = (typeof DISTANCE_LINE_TARGETS)[number]['value'];

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * 坐标输入框
 */
function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <InputNumber value={value} onChange={onChange} step={1} className={styles.control} />
    </label>
  );
}

/**
 * 将点格式化为同时含分数与小数的文本
 */
function pointText(point: Point): string {
  return `(${formatExact(point.x)}, ${formatExact(point.y)})`;
}

const RELATION_LABEL: Record<LineRelation, string> = {
  intersect: '相交',
  parallel: '平行',
  coincident: '重合',
};

const RELATION_COLOR: Record<LineRelation, string> = {
  intersect: 'green',
  parallel: 'orange',
  coincident: 'blue',
};

export default function AnalyticGeometryCalculatorTool() {
  const [p1x, setP1x] = useState<number | null>(DEFAULT_POINT_1.x);
  const [p1y, setP1y] = useState<number | null>(DEFAULT_POINT_1.y);
  const [p2x, setP2x] = useState<number | null>(DEFAULT_POINT_2.x);
  const [p2y, setP2y] = useState<number | null>(DEFAULT_POINT_2.y);

  const [secondMode, setSecondMode] = useState<SecondLineMode>('general');
  const [lineA, setLineA] = useState<number | null>(DEFAULT_SECOND_LINE.a);
  const [lineB, setLineB] = useState<number | null>(DEFAULT_SECOND_LINE.b);
  const [lineC, setLineC] = useState<number | null>(DEFAULT_SECOND_LINE.c);
  const [p3x, setP3x] = useState<number | null>(DEFAULT_SECOND_POINT_3.x);
  const [p3y, setP3y] = useState<number | null>(DEFAULT_SECOND_POINT_3.y);
  const [p4x, setP4x] = useState<number | null>(DEFAULT_SECOND_POINT_4.x);
  const [p4y, setP4y] = useState<number | null>(DEFAULT_SECOND_POINT_4.y);

  const [px, setPx] = useState<number | null>(DEFAULT_DISTANCE_POINT.x);
  const [py, setPy] = useState<number | null>(DEFAULT_DISTANCE_POINT.y);
  const [distanceTarget, setDistanceTarget] = useState<DistanceLineTarget>('second');

  const firstPair = useMemo<{ p1: Point; p2: Point } | null>(() => {
    if (p1x === null || p1y === null || p2x === null || p2y === null) {
      return null;
    }
    return { p1: { x: p1x, y: p1y }, p2: { x: p2x, y: p2y } };
  }, [p1x, p1y, p2x, p2y]);

  const firstLine = useMemo<Line | null>(() => {
    if (!firstPair) {
      return null;
    }
    try {
      return lineThroughPoints(firstPair.p1, firstPair.p2);
    } catch {
      return null;
    }
  }, [firstPair]);

  const secondLine = useMemo<Line | null>(() => {
    try {
      if (secondMode === 'general') {
        if (lineA === null || lineB === null || lineC === null) {
          return null;
        }
        return lineFromGeneral(lineA, lineB, lineC);
      }
      if (p3x === null || p3y === null || p4x === null || p4y === null) {
        return null;
      }
      return lineThroughPoints({ x: p3x, y: p3y }, { x: p4x, y: p4y });
    } catch {
      return null;
    }
  }, [lineA, lineB, lineC, p3x, p3y, p4x, p4y, secondMode]);

  const relation = useMemo<LineRelation | null>(() => {
    if (!firstLine || !secondLine) {
      return null;
    }
    try {
      return lineRelation(firstLine, secondLine);
    } catch {
      return null;
    }
  }, [firstLine, secondLine]);

  const intersectionPoint = useMemo<Point | null>(() => {
    if (!firstLine || !secondLine) {
      return null;
    }
    try {
      return intersection(firstLine, secondLine);
    } catch {
      return null;
    }
  }, [firstLine, secondLine]);

  const distanceResult = useMemo(() => {
    const targetPoint = px === null || py === null ? null : { x: px, y: py };
    const targetLine = distanceTarget === 'first' ? firstLine : secondLine;
    if (!targetPoint || !targetLine) {
      return null;
    }
    try {
      return {
        distance: distancePointToLine(targetPoint, targetLine),
        foot: footOfPerpendicular(targetPoint, targetLine),
        perpendicular: perpendicularLineThrough(targetLine, targetPoint),
      };
    } catch {
      return null;
    }
  }, [distanceTarget, firstLine, px, py, secondLine]);

  const firstSlope = firstLine ? slopeOfLine(firstLine) : null;

  return (
    <div className={styles.container}>
      <Card title="第一组两点与直线">
        <div className={styles.inputs}>
          <NumberField label="x₁" value={p1x} onChange={setP1x} />
          <NumberField label="y₁" value={p1y} onChange={setP1y} />
          <NumberField label="x₂" value={p2x} onChange={setP2x} />
          <NumberField label="y₂" value={p2y} onChange={setP2y} />
        </div>

        {firstPair ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>两点距离</span>
                <span className={styles.value}>
                  {formatDecimal(distanceBetweenPoints(firstPair.p1, firstPair.p2), 6)}
                </span>
                <span className={styles.sub}>√((x₂-x₁)² + (y₂-y₁)²)</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>中点坐标</span>
                <span className={styles.value}>{pointText(midpoint(firstPair.p1, firstPair.p2))}</span>
                <span className={styles.sub}>两点坐标的平均值</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>斜率 k</span>
                <span className={styles.value}>
                  {firstLine === null ? '—' : firstSlope === null ? '不存在' : formatExact(firstSlope)}
                </span>
                <span className={styles.sub}>{firstSlope === null ? '两点重合或竖直线' : '(y₂-y₁) / (x₂-x₁)'}</span>
              </div>
            </div>

            {firstLine ? (
              <div className={styles.equations}>
                <span className={styles.equation}>一般式：{formatGeneralForm(firstLine)}</span>
                <span className={styles.equation}>
                  斜截式：{formatSlopeIntercept(firstLine) ?? '斜率不存在（x = 常数）'}
                </span>
                <span className={styles.equation}>
                  点斜式：{formatPointSlope(firstLine, firstPair.p1)}
                </span>
              </div>
            ) : (
              <Alert type="warning" showIcon message="两点重合，无法确定唯一一条直线" />
            )}
          </>
        ) : (
          <Alert type="warning" showIcon message="请填写完整的第一组两点坐标" />
        )}
      </Card>

      <Card title="第二条直线与位置关系">
        <Radio.Group
          value={secondMode}
          onChange={(event) => setSecondMode(event.target.value)}
          options={LINE_INPUT_MODES.map((item) => ({ label: item.label, value: item.value }))}
          className={styles.modeGroup}
        />

        {secondMode === 'general' ? (
          <div className={styles.inputs}>
            <NumberField label="A" value={lineA} onChange={setLineA} />
            <NumberField label="B" value={lineB} onChange={setLineB} />
            <NumberField label="C" value={lineC} onChange={setLineC} />
          </div>
        ) : (
          <div className={styles.inputs}>
            <NumberField label="x₃" value={p3x} onChange={setP3x} />
            <NumberField label="y₃" value={p3y} onChange={setP3y} />
            <NumberField label="x₄" value={p4x} onChange={setP4x} />
            <NumberField label="y₄" value={p4y} onChange={setP4y} />
          </div>
        )}

        {secondLine ? (
          <>
            <div className={styles.equations}>
              <span className={styles.equation}>一般式：{formatGeneralForm(secondLine)}</span>
              <span className={styles.equation}>
                斜截式：{formatSlopeIntercept(secondLine) ?? '斜率不存在（x = 常数）'}
              </span>
            </div>
            <Space wrap>
              {relation ? (
                <Tag color={RELATION_COLOR[relation]}>两条直线{RELATION_LABEL[relation]}</Tag>
              ) : null}
              {intersectionPoint ? (
                <Tag color="green">交点 {pointText(intersectionPoint)}</Tag>
              ) : relation === 'parallel' ? (
                <Tag color="orange">平行无交点</Tag>
              ) : relation === 'coincident' ? (
                <Tag color="blue">重合，交点为整条直线</Tag>
              ) : null}
            </Space>
          </>
        ) : (
          <Alert type="warning" showIcon message="请填写有效的第二条直线（A、B 不能同时为 0）" />
        )}
      </Card>

      <Card title="点到直线距离与垂足">
        <div className={styles.inputs}>
          <NumberField label="点 x" value={px} onChange={setPx} />
          <NumberField label="点 y" value={py} onChange={setPy} />
          <label className={styles.field}>
            <span className={styles.label}>目标直线</span>
            <Select
              value={distanceTarget}
              onChange={setDistanceTarget}
              options={DISTANCE_LINE_TARGETS.map((item) => ({ label: item.label, value: item.value }))}
              className={styles.control}
            />
          </label>
        </div>

        {distanceResult ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>距离 d</span>
                <span className={styles.value}>{formatDecimal(distanceResult.distance, 6)}</span>
                <span className={styles.sub}>|Ax₀ + By₀ + C| / √(A² + B²)</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>垂足坐标</span>
                <span className={styles.value}>{pointText(distanceResult.foot)}</span>
                <span className={styles.sub}>点到直线的最近点</span>
              </div>
            </div>
            <div className={styles.equations}>
              <span className={styles.equation}>
                过该点且垂直于目标直线的直线：{formatGeneralForm(distanceResult.perpendicular)}
              </span>
              <span className={styles.equation}>
                垂线斜截式：{formatSlopeIntercept(distanceResult.perpendicular) ?? '斜率不存在'}
              </span>
            </div>
          </>
        ) : (
          <Alert type="warning" showIcon message="请填写完整的点坐标，并确保目标直线有效" />
        )}
      </Card>
    </div>
  );
}
