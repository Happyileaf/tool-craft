"use client";

import React from "react";
import { Alert, Card, Input, Radio, Tag } from "antd";
import type { ToolComponentProps } from "../loaders";
import { MODULE_OPTIONS, GeometryModule } from "./constants";
import {
  parseNumber,
  analyzeTwoPoints,
  lineFromSlopeIntercept,
  relateLines,
  pointToLineDistance,
  formatLineEquation,
  formatNumber,
  type LineGeneral,
  type LineRelation,
  type Point,
} from "./utils/geometry";
import styles from "./index.module.css";

function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

/** 坐标输入对 */
const PointInputs: React.FC<{
  label: string;
  value: { x: string; y: string };
  onChange: (next: { x: string; y: string }) => void;
}> = ({ label, value, onChange }) => (
  <div className={styles.pointCard}>
    <strong>{label}</strong>
    <div className={styles.row}>
      <div className={styles.field}>
        <span className={styles.label}>x</span>
        <Input
          style={{ width: 120 }}
          value={value.x}
          onChange={(e) => onChange({ ...value, x: e.target.value })}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>y</span>
        <Input
          style={{ width: 120 }}
          value={value.y}
          onChange={(e) => onChange({ ...value, y: e.target.value })}
        />
      </div>
    </div>
  </div>
);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={styles.metric}>
    <span className={styles.metricLabel}>{label}</span>
    <span className={styles.metricValue}>{value}</span>
  </div>
);

type LineRelationState =
  | { error: string }
  | { relation: LineRelation; line1: LineGeneral; line2: LineGeneral };

const renderLineRelation = (state: LineRelationState) => {
  if ("error" in state) {
    return <Alert type="error" showIcon message={state.error} />;
  }
  return (
    <>
      <div className={styles.row} style={{ marginBottom: 12 }}>
        <Tag color="blue">L1: {formatLineEquation(state.line1)}</Tag>
        <Tag color="purple">L2: {formatLineEquation(state.line2)}</Tag>
      </div>
      <RelationAlert relation={state.relation} />
    </>
  );
};

const RelationAlert: React.FC<{ relation: LineRelation }> = ({ relation }) => {
  if (relation.kind === "parallel") {
    return <Alert type="info" showIcon message="两直线平行（斜率相同、截距不同），无交点" />;
  }
  if (relation.kind === "coincident") {
    return <Alert type="warning" showIcon message="两直线完全重合，有无穷多个公共点" />;
  }
  const pointText = `(${formatNumber(relation.point.x)}, ${formatNumber(relation.point.y)})`;
  if (relation.kind === "perpendicular") {
    return <Alert type="success" showIcon message={`两直线互相垂直，垂足为 ${pointText}`} />;
  }
  return <Alert type="success" showIcon message={`两直线相交于 ${pointText}`} />;
};

const PlaneGeometryCalculator: React.FC<ToolComponentProps> = () => {
  const [module, setModule] = React.useState<GeometryModule>(GeometryModule.TWO_POINTS);

  // 模块一：两点
  const [p1, setP1] = React.useState({ x: "0", y: "0" });
  const [p2, setP2] = React.useState({ x: "3", y: "4" });

  // 模块二：两条斜截式直线 y = kx + b
  const [l1Input, setL1Input] = React.useState({ k: "1", b: "0" });
  const [l2Input, setL2Input] = React.useState({ k: "-1", b: "2" });

  // 模块三：点与直线
  const [point, setPoint] = React.useState({ x: "1", y: "1" });
  const [lineInput, setLineInput] = React.useState({ k: "1", b: "0" });

  const twoPointResult = React.useMemo(() => {
    const a = { x: parseNumber(p1.x), y: parseNumber(p1.y) };
    const b = { x: parseNumber(p2.x), y: parseNumber(p2.y) };
    if (Object.values(a).some((v) => v === null) || Object.values(b).some((v) => v === null)) {
      return { error: "请为两个点填写完整的有效坐标" };
    }
    return analyzeTwoPoints(a as Point, b as Point);
  }, [p1, p2]);

  const lineRelation = React.useMemo(() => {
    const k1 = parseNumber(l1Input.k);
    const b1 = parseNumber(l1Input.b);
    const k2 = parseNumber(l2Input.k);
    const b2 = parseNumber(l2Input.b);
    if ([k1, b1, k2, b2].some((v) => v === null)) {
      return { error: "请填写完整的斜率与截距（竖直直线请用一般式思路取极大斜率近似，或改用两点模块）" };
    }
    const line1: LineGeneral = lineFromSlopeIntercept(k1 as number, b1 as number);
    const line2: LineGeneral = lineFromSlopeIntercept(k2 as number, b2 as number);
    const relation = relateLines(line1, line2);
    if ("error" in relation) {
      return { error: relation.error };
    }
    return { relation, line1, line2 };
  }, [l1Input, l2Input]);

  const distanceResult = React.useMemo(() => {
    const pt = { x: parseNumber(point.x), y: parseNumber(point.y) };
    const k = parseNumber(lineInput.k);
    const b = parseNumber(lineInput.b);
    if (pt.x === null || pt.y === null || k === null || b === null) {
      return { error: "请填写完整的点坐标与直线参数" };
    }
    const line = lineFromSlopeIntercept(k, b);
    return { line, distance: pointToLineDistance(pt as Point, line) };
  }, [point, lineInput]);

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={module}
        options={MODULE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(e) => setModule(e.target.value as GeometryModule)}
      />

      {module === GeometryModule.TWO_POINTS && (
        <Card title="两点参数：斜率、倾斜角、距离、中点、直线方程">
          <div className={styles.row}>
            <PointInputs label="点 P1" value={p1} onChange={setP1} />
            <PointInputs label="点 P2" value={p2} onChange={setP2} />
          </div>
          <div style={{ marginTop: 16 }}>
            {isError(twoPointResult) ? (
              <Alert type="error" showIcon message={twoPointResult.error} />
            ) : (
              <div className={styles.resultGrid}>
                <Metric label="斜率 k" value={formatNumber(twoPointResult.slope)} />
                <Metric label="倾斜角" value={`${formatNumber(twoPointResult.angleDeg)}°`} />
                <Metric label="两点距离" value={formatNumber(twoPointResult.length)} />
                <Metric
                  label="中点"
                  value={`(${formatNumber(twoPointResult.midpoint.x)}, ${formatNumber(twoPointResult.midpoint.y)})`}
                />
                <Metric label="一般式方程" value={formatLineEquation(twoPointResult.line)} />
              </div>
            )}
          </div>
        </Card>
      )}

      {module === GeometryModule.LINES && (
        <Card title="两直线关系与交点（斜截式 y = kx + b）">
          <div className={styles.row}>
            <div className={styles.pointCard}>
              <strong>直线 L1：y = k1x + b1</strong>
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.label}>k1</span>
                  <Input style={{ width: 120 }} value={l1Input.k} onChange={(e) => setL1Input({ ...l1Input, k: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>b1</span>
                  <Input style={{ width: 120 }} value={l1Input.b} onChange={(e) => setL1Input({ ...l1Input, b: e.target.value })} />
                </div>
              </div>
            </div>
            <div className={styles.pointCard}>
              <strong>直线 L2：y = k2x + b2</strong>
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.label}>k2</span>
                  <Input style={{ width: 120 }} value={l2Input.k} onChange={(e) => setL2Input({ ...l2Input, k: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>b2</span>
                  <Input style={{ width: 120 }} value={l2Input.b} onChange={(e) => setL2Input({ ...l2Input, b: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>{renderLineRelation(lineRelation)}</div>
        </Card>
      )}

      {module === GeometryModule.POINT_LINE && (
        <Card title="点到直线的距离（直线用斜截式 y = kx + b 输入）">
          <div className={styles.row}>
            <PointInputs label="点 P" value={point} onChange={setPoint} />
            <div className={styles.pointCard}>
              <strong>直线 L：y = kx + b</strong>
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.label}>k</span>
                  <Input style={{ width: 120 }} value={lineInput.k} onChange={(e) => setLineInput({ ...lineInput, k: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>b</span>
                  <Input style={{ width: 120 }} value={lineInput.b} onChange={(e) => setLineInput({ ...lineInput, b: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {"error" in distanceResult ? (
              <Alert type="error" showIcon message={distanceResult.error} />
            ) : (
              <div className={styles.resultGrid}>
                <Metric label="直线一般式" value={formatLineEquation(distanceResult.line)} />
                <Metric
                  label="点到直线距离"
                  value={typeof distanceResult.distance === "number" ? formatNumber(distanceResult.distance) : distanceResult.distance.error}
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlaneGeometryCalculator;
