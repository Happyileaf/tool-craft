'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Card,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  analyzeProjectile,
  toFeetPerSecond,
  toKmh,
  type LaunchMode,
  type ProjectileInput,
  type SpeedUnit,
  type TrajectoryPoint,
} from './utils/projectile';
import styles from './index.module.css';

const SVG_WIDTH = 760;
const SVG_HEIGHT = 380;
const SVG_PADDING = { top: 24, right: 24, bottom: 44, left: 56 };

const MODE_OPTIONS: { label: string; value: LaunchMode }[] = [
  { label: '自由落体', value: 'free-fall' },
  { label: '平抛', value: 'horizontal' },
  { label: '斜抛', value: 'oblique' },
];

const UNIT_OPTIONS: { label: string; value: SpeedUnit }[] = [
  { label: 'm/s', value: 'ms' },
  { label: 'km/h', value: 'kmh' },
  { label: 'ft/s', value: 'fts' },
];

const G_PRESETS = [
  { label: '9.8 m/s²（中学常用）', value: 9.8 },
  { label: '9.81 m/s²（标准重力）', value: 9.81 },
  { label: '自定义', value: -1 },
];

interface ChartGeometry {
  xMax: number;
  yMax: number;
  mapX: (x: number) => number;
  mapY: (y: number) => number;
}

interface TrajectoryRow extends TrajectoryPoint {
  key: string;
}

/**
 * 抛体运动计算器与轨迹可视化。
 * 真空模式为闭合解析公式；开启线性空气阻力后用 RK4 数值积分，并在同一张 SVG 上对比两条轨迹。
 * 全部计算在浏览器本地完成，零网络请求。
 */
export default function ProjectileMotionCalculator(_props: ToolComponentProps) {
  const [mode, setMode] = useState<LaunchMode>('oblique');
  const [initialSpeed, setInitialSpeed] = useState<number>(20);
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [initialHeight, setInitialHeight] = useState<number>(0);
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('ms');
  const [gPreset, setGPreset] = useState<number>(9.8);
  const [customG, setCustomG] = useState<number>(9.8);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [dragCoefficient, setDragCoefficient] = useState<number>(0.2);

  const gravity = gPreset === -1 ? customG : gPreset;

  const input: ProjectileInput = useMemo(
    () => ({
      mode,
      initialSpeed,
      angleDeg,
      initialHeight,
      gravity,
      speedUnit,
      dragCoefficient: dragEnabled ? dragCoefficient : 0,
    }),
    [mode, initialSpeed, angleDeg, initialHeight, gravity, speedUnit, dragEnabled, dragCoefficient],
  );

  const analysis = useMemo(() => analyzeProjectile(input), [input]);

  const geometry: ChartGeometry | null = useMemo(() => {
    if (!analysis.ok) {
      return null;
    }
    const allPoints = [
      ...analysis.vacuum.points,
      ...(analysis.drag ? analysis.drag.points : []),
    ];
    const xMax = Math.max(...allPoints.map((p) => p.x), 1);
    const yMax = Math.max(...allPoints.map((p) => p.y), 1);
    const plotWidth = SVG_WIDTH - SVG_PADDING.left - SVG_PADDING.right;
    const plotHeight = SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom;
    return {
      xMax,
      yMax,
      mapX: (x) => SVG_PADDING.left + (x / xMax) * plotWidth,
      mapY: (y) => SVG_PADDING.top + plotHeight - (y / yMax) * plotHeight,
    };
  }, [analysis]);

  const tableRows: TrajectoryRow[] = useMemo(() => {
    if (!analysis.ok) {
      return [];
    }
    return analysis.vacuum.points.map((point, index) => ({
      ...point,
      key: `vacuum-${index}`,
    }));
  }, [analysis]);

  const columns: ColumnsType<TrajectoryRow> = [
    { title: 't (s)', dataIndex: 't', width: 90, align: 'right', render: (v: number) => v.toFixed(3) },
    { title: 'x (m)', dataIndex: 'x', width: 100, align: 'right', render: (v: number) => v.toFixed(3) },
    { title: 'y (m)', dataIndex: 'y', width: 100, align: 'right', render: (v: number) => v.toFixed(3) },
    { title: 'vx (m/s)', dataIndex: 'vx', width: 110, align: 'right', render: (v: number) => v.toFixed(3) },
    { title: 'vy (m/s)', dataIndex: 'vy', width: 110, align: 'right', render: (v: number) => v.toFixed(3) },
    {
      title: '|v| (m/s)',
      dataIndex: 'speed',
      width: 110,
      align: 'right',
      render: (v: number) => v.toFixed(3),
    },
  ];

  const renderPath = (points: TrajectoryPoint[]) => {
    if (!geometry) {
      return '';
    }
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${geometry.mapX(p.x).toFixed(2)},${geometry.mapY(p.y).toFixed(2)}`)
      .join(' ');
  };

  const renderMarkers = (points: TrajectoryPoint[], fill: string, radius: number) => {
    if (!geometry) {
      return null;
    }
    return points.slice(0, -1).map((p, i) => (
      <circle
        key={`${fill}-${i}`}
        cx={geometry.mapX(p.x)}
        cy={geometry.mapY(p.y)}
        r={radius}
        fill={fill}
        opacity={0.75}
      />
    ));
  };

  const renderGrid = () => {
    if (!geometry) {
      return null;
    }
    const lines = [];
    for (let i = 0; i <= 4; i += 1) {
      const x = SVG_PADDING.left + ((SVG_WIDTH - SVG_PADDING.left - SVG_PADDING.right) * i) / 4;
      const y = SVG_PADDING.top + ((SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom) * i) / 4;
      lines.push(
        <line key={`vx-${i}`} x1={x} y1={SVG_PADDING.top} x2={x} y2={SVG_HEIGHT - SVG_PADDING.bottom} stroke="#e5e7eb" strokeWidth={1} />,
      );
      lines.push(
        <line key={`hy-${i}`} x1={SVG_PADDING.left} y1={y} x2={SVG_WIDTH - SVG_PADDING.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />,
      );
    }
    return lines;
  };

  const formatSpeed = (ms: number) => {
    if (speedUnit === 'kmh') {
      return `${toKmh(ms).toFixed(2)} km/h`;
    }
    if (speedUnit === 'fts') {
      return `${toFeetPerSecond(ms).toFixed(2)} ft/s`;
    }
    return `${ms.toFixed(3)} m/s`;
  };

  const diffPercent = (dragValue: number, vacuumValue: number) =>
    vacuumValue === 0 ? null : (((dragValue - vacuumValue) / vacuumValue) * 100).toFixed(1);

  const vacuum = analysis.vacuum;
  const drag = analysis.drag;

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="抛体运动计算器与轨迹可视化"
        description="支持自由落体、平抛、斜抛三种模式，单位 m/s、km/h、ft/s 可选；真空模式为解析公式，线性空气阻力（F=-k·v）模式为 RK4 数值积分。所有计算均在本地完成。"
      />

      <Card size="small" title="输入参数">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented options={MODE_OPTIONS} value={mode} onChange={(value) => setMode(value as LaunchMode)} />

          <div className={styles.formGrid}>
            {mode !== 'free-fall' && (
              <div className={styles.field}>
                <label>初速度（{UNIT_OPTIONS.find((u) => u.value === speedUnit)?.label}）</label>
                <InputNumber
                  min={0}
                  step={1}
                  value={initialSpeed}
                  onChange={(value) => setInitialSpeed(value ?? 0)}
                />
              </div>
            )}
            {mode === 'oblique' && (
              <div className={styles.field}>
                <label>发射角度（°）</label>
                <InputNumber
                  min={0}
                  max={90}
                  step={1}
                  value={angleDeg}
                  onChange={(value) => setAngleDeg(value ?? 0)}
                />
              </div>
            )}
            <div className={styles.field}>
              <label>初始高度（m）</label>
              <InputNumber
                min={0}
                step={1}
                value={initialHeight}
                onChange={(value) => setInitialHeight(value ?? 0)}
              />
            </div>
            <div className={styles.field}>
              <label>速度单位</label>
              <Select
                value={speedUnit}
                onChange={setSpeedUnit}
                options={UNIT_OPTIONS}
                disabled={mode === 'free-fall'}
              />
            </div>
            <div className={styles.field}>
              <label>重力加速度 g</label>
              <Select
                value={gPreset}
                onChange={setGPreset}
                options={G_PRESETS}
              />
            </div>
            {gPreset === -1 && (
              <div className={styles.field}>
                <label>自定义 g（m/s²）</label>
                <InputNumber
                  min={0.01}
                  step={0.01}
                  value={customG}
                  onChange={(value) => setCustomG(value ?? 9.8)}
                />
              </div>
            )}
          </div>

          <div className={styles.dragRow}>
            <Switch checked={dragEnabled} onChange={setDragEnabled} />
            <Typography.Text>线性空气阻力 F = −k·v</Typography.Text>
            {dragEnabled && (
              <div className={styles.field} style={{ width: 180 }}>
                <label>阻力系数 k（1/s）</label>
                <InputNumber
                  min={0.001}
                  step={0.05}
                  value={dragCoefficient}
                  onChange={(value) => setDragCoefficient(value ?? 0.2)}
                />
              </div>
            )}
          </div>
        </Space>
      </Card>

      {!analysis.ok && (
        <Alert type="error" showIcon message="参数无效" description={analysis.error} />
      )}

      {analysis.ok && (
        <>
          <Card size="small" title="运动学结果（真空解析解）">
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {vacuum.flightTime.toFixed(3)}
                  <span className={styles.statUnit}>s</span>
                </div>
                <div className={styles.statLabel}>飞行时间</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {vacuum.range.toFixed(3)}
                  <span className={styles.statUnit}>m</span>
                  {drag && (
                    <Tag className={styles.compareTag} color="orange">
                      阻力 {drag.range.toFixed(2)}（{diffPercent(drag.range, vacuum.range)}%）
                    </Tag>
                  )}
                </div>
                <div className={styles.statLabel}>水平射程</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {vacuum.maxHeight.toFixed(3)}
                  <span className={styles.statUnit}>m</span>
                </div>
                <div className={styles.statLabel}>最大高度</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {vacuum.timeToApex.toFixed(3)}
                  <span className={styles.statUnit}>s</span>
                </div>
                <div className={styles.statLabel}>到达最高点时刻</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  ({vacuum.apexx.toFixed(2)}, {vacuum.maxHeight.toFixed(2)})
                </div>
                <div className={styles.statLabel}>最高点坐标 (m)</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{formatSpeed(vacuum.landingSpeed)}</div>
                <div className={styles.statLabel}>落地速度</div>
              </div>
            </div>
            <p className={styles.hint} style={{ marginTop: 12 }}>
              初速度分量：vx₀ = {analysis.vx0.toFixed(3)} m/s，vy₀ = {analysis.vy0.toFixed(3)} m/s
              {drag && '；橙色标签为空气阻力模式相对真空解的偏差。'}
            </p>
          </Card>

          {geometry && (
            <Card size="small" title="轨迹曲线（圆点为等时间隔标记）" className={styles.chartCard}>
              <svg
                className={styles.chartSvg}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                role="img"
                aria-label="抛体运动轨迹图"
              >
                {renderGrid()}
                <line
                  x1={SVG_PADDING.left}
                  y1={SVG_HEIGHT - SVG_PADDING.bottom}
                  x2={SVG_WIDTH - SVG_PADDING.right}
                  y2={SVG_HEIGHT - SVG_PADDING.bottom}
                  stroke="#374151"
                  strokeWidth={1.5}
                />
                <line
                  x1={SVG_PADDING.left}
                  y1={SVG_PADDING.top}
                  x2={SVG_PADDING.left}
                  y2={SVG_HEIGHT - SVG_PADDING.bottom}
                  stroke="#374151"
                  strokeWidth={1.5}
                />
                <text x={SVG_WIDTH - SVG_PADDING.right} y={SVG_HEIGHT - 12} textAnchor="end" fontSize={12} fill="#6b7280">
                  x (m)，最大 {geometry.xMax.toFixed(1)}
                </text>
                <text x={14} y={SVG_PADDING.top + 4} fontSize={12} fill="#6b7280">
                  y (m)，最高 {geometry.yMax.toFixed(1)}
                </text>

                <path d={renderPath(vacuum.points)} fill="none" stroke="#1677ff" strokeWidth={2.5} />
                {renderMarkers(vacuum.points, '#1677ff', 3.5)}

                {drag && (
                  <>
                    <path d={renderPath(drag.points)} fill="none" stroke="#fa8c16" strokeWidth={2.5} strokeDasharray="7 5" />
                    {renderMarkers(drag.points, '#fa8c16', 3)}
                  </>
                )}
              </svg>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendLine} style={{ borderColor: '#1677ff' }} />
                  真空轨迹（解析解）
                </span>
                {drag && (
                  <span className={styles.legendItem}>
                    <span className={styles.legendLine} style={{ borderColor: '#fa8c16', borderTopStyle: 'dashed' }} />
                    阻力轨迹（RK4 积分，k={dragCoefficient}/s）
                  </span>
                )}
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#1677ff' }} />
                  等时间隔采样点
                </span>
              </div>
            </Card>
          )}

          <Card size="small" title="真空轨迹逐点数据（等时间隔）">
            <Table<TrajectoryRow>
              columns={columns}
              dataSource={tableRows}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>

          <p className={styles.hint}>
            说明：真空模式由 y = h₀ + vy₀t − ½gt² 等闭合公式求解，可作为教学标准答案；空气阻力采用与速度成正比的线性模型，
            由四阶 Runge–Kutta 定步长积分至首次触地并插值，因此阻力轨迹的射程、飞行时间与落地速度均不大于真空解。
          </p>
        </>
      )}
    </div>
  );
}
