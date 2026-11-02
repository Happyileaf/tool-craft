'use client';

import React from 'react';
import { Alert, Button, Card, InputNumber, message } from 'antd';
import { CopyOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  PLOT_PADDING,
  PLOT_SIZE,
  PRESET_ITEMS,
  DEFAULT_POINTS,
  Y_MAX,
  Y_MIN,
} from './constants';
import {
  BEZIER_PRESETS,
  formatBezier,
  sampleBezier,
  solveCubicBezierY,
  validateBezier,
  type BezierControlPoints,
} from './utils/bezier';
import styles from './index.module.css';

const INNER = PLOT_SIZE - PLOT_PADDING * 2;

/** 数据坐标 [0,1]×[Y_MIN,Y_MAX] → SVG 像素（y 轴翻转） */
const toPixelX = (x: number): number => PLOT_PADDING + x * INNER;
const toPixelY = (y: number): number =>
  PLOT_PADDING + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * INNER;
const fromPixelX = (px: number): number => (px - PLOT_PADDING) / INNER;
const fromPixelY = (py: number): number =>
  Y_MAX - ((py - PLOT_PADDING) / INNER) * (Y_MAX - Y_MIN);

type HandleKey = 'p1' | 'p2';

const CubicBezierGenerator: React.FC = () => {
  const [points, setPoints] = React.useState<BezierControlPoints>(DEFAULT_POINTS);
  const [activePreset, setActivePreset] = React.useState<string>('ease');
  const [dragging, setDragging] = React.useState<HandleKey | null>(null);
  const [duration, setDuration] = React.useState(1);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const error = React.useMemo(() => validateBezier(points), [points]);
  const cssValue = React.useMemo(() => formatBezier(points), [points]);

  const pathD = React.useMemo(() => {
    const samples = sampleBezier(points, 48);
    return samples
      .map((p, index) => `${index === 0 ? 'M' : 'L'} ${toPixelX(p.x)} ${toPixelY(p.y)}`)
      .join(' ');
  }, [points]);

  const handleFields = [
    { key: 'x1', label: 'x1（0–1）', value: points.x1 },
    { key: 'y1', label: 'y1', value: points.y1 },
    { key: 'x2', label: 'x2（0–1）', value: points.x2 },
    { key: 'y2', label: 'y2', value: points.y2 },
  ] as const;

  const updatePoint = (key: keyof BezierControlPoints, value: number | null) => {
    if (value === null || Number.isNaN(value)) return;
    setActivePreset('custom');
    setPoints((previous) => ({ ...previous, [key]: value }));
  };

  const applyPreset = (key: string) => {
    const preset = BEZIER_PRESETS[key];
    if (!preset) return;
    setActivePreset(key);
    setPoints({ ...preset });
  };

  /** 将 SVG 指针位置换算为控制点坐标 */
  const pointerToPoints = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = PLOT_SIZE / rect.width;
    const scaleY = PLOT_SIZE / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const pixel = pointerToPoints(event);
    if (!pixel) return;
    const rawX = fromPixelX(pixel.x);
    const rawY = fromPixelY(pixel.y);
    const x = Math.min(1, Math.max(0, rawX));
    const y = Math.min(Y_MAX, Math.max(Y_MIN, rawY));
    const roundedX = Math.round(x * 1000) / 1000;
    const roundedY = Math.round(y * 1000) / 1000;
    setActivePreset('custom');
    setPoints((previous) =>
      dragging === 'p1'
        ? { ...previous, x1: roundedX, y1: roundedY }
        : { ...previous, x2: roundedX, y2: roundedY },
    );
  };

  const stopDrag = () => setDragging(null);

  // 动画演示：用 requestAnimationFrame 按当前曲线驱动方块位移
  const blockRef = React.useRef<HTMLDivElement | null>(null);
  const progressRef = React.useRef<HTMLSpanElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const play = () => {
    if (error) {
      message.error('控制点不合法，无法播放动画');
      return;
    }
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const durationMs = duration * 1000;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = solveCubicBezierY(t, points);
      if (blockRef.current) {
        const trackWidth = blockRef.current.parentElement?.clientWidth ?? 300;
        blockRef.current.style.transform = `translateX(${Math.max(
          0,
          eased * (trackWidth - 40),
        )}px)`;
      }
      if (progressRef.current) {
        progressRef.current.textContent = `t=${t.toFixed(2)} → ${eased.toFixed(3)}`;
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const p1 = { x: toPixelX(points.x1), y: toPixelY(points.y1) };
  const p2 = { x: toPixelX(points.x2), y: toPixelY(points.y2) };
  const origin = { x: toPixelX(0), y: toPixelY(0) };
  const end = { x: toPixelX(1), y: toPixelY(1) };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <Card className={styles.plotCard} title="曲线编辑（拖拽控制点）">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
            className={styles.plotSvg}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            {/* 单位方框 */}
            <rect
              x={origin.x}
              y={toPixelY(1)}
              width={INNER}
              height={toPixelY(0) - toPixelY(1)}
              fill="none"
              stroke="rgba(148,163,184,0.5)"
              strokeWidth={1}
            />
            {/* y=0 / y=1 辅助线 */}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={end.x}
              y2={origin.y}
              stroke="rgba(148,163,184,0.25)"
              strokeWidth={1}
            />
            {/* 控制杆 */}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={p1.x}
              y2={p1.y}
              stroke="#f59e0b"
              strokeWidth={1.5}
              className={styles.controlLine}
            />
            <line
              x1={end.x}
              y1={end.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#10b981"
              strokeWidth={1.5}
              className={styles.controlLine}
            />
            {/* 贝塞尔曲线 */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* 端点 */}
            <circle cx={origin.x} cy={origin.y} r={5} fill="#94a3b8" />
            <circle cx={end.x} cy={end.y} r={5} fill="#94a3b8" />
            {/* 可拖拽控制点 */}
            <circle
              cx={p1.x}
              cy={p1.y}
              r={7}
              fill="#f59e0b"
              className={styles.handle}
              onPointerDown={(event) => {
                event.preventDefault();
                setDragging('p1');
              }}
            />
            <circle
              cx={p2.x}
              cy={p2.y}
              r={7}
              fill="#10b981"
              className={styles.handle}
              onPointerDown={(event) => {
                event.preventDefault();
                setDragging('p2');
              }}
            />
          </svg>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            横轴为时间进度（0–1），纵轴为输出进度；纵向可超出 [0,1] 以呈现过冲/回弹。
          </div>
        </Card>

        <Card className={styles.controlsCard} title="参数与输出">
          <div className={styles.fields}>
            {handleFields.map((field) => (
              <label className={styles.fieldLabel} key={field.key}>
                {field.label}
                <InputNumber
                  value={field.value}
                  step={0.05}
                  onChange={(value) => updatePoint(field.key, value)}
                  style={{ width: '100%' }}
                />
              </label>
            ))}
          </div>

          {error ? (
            <Alert style={{ marginTop: 12 }} type="error" showIcon message={error} />
          ) : null}

          <div style={{ marginTop: 16 }} className={styles.presets}>
            {PRESET_ITEMS.map((item) => (
              <Button
                key={item.key}
                size="small"
                type={activePreset === item.key ? 'primary' : 'default'}
                onClick={() => applyPreset(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className={styles.codeBox} style={{ marginTop: 16 }}>
            <code className={styles.codeText}>{cssValue}</code>
            <Button
              size="small"
              icon={<CopyOutlined />}
              disabled={Boolean(error)}
              onClick={() => {
                copyToClipboard(cssValue);
                message.success('已复制 CSS 缓动函数');
              }}
            >
              复制
            </Button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={play}
                disabled={Boolean(error) || reducedMotion}
              >
                播放动画
              </Button>
              <span style={{ fontSize: 12 }}>时长</span>
              <InputNumber
                size="small"
                min={0.2}
                max={5}
                step={0.2}
                value={duration}
                onChange={(value) => setDuration(value ?? 1)}
                style={{ width: 80 }}
                addonAfter="s"
              />
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                transition: transform {duration}s {cssValue};
              </span>
            </div>
            <div className={styles.demoTrack}>
              <div className={styles.demoBlock} ref={blockRef} />
            </div>
            <div className={styles.demoMeta}>
              <span ref={progressRef}>点击「播放动画」查看实时缓动值</span>
              <span>0% → 100%</span>
            </div>
          </div>
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="关于 cubic-bezier"
        description="CSS 动画时序函数 cubic-bezier(x1, y1, x2, y2) 固定从 (0,0) 到 (1,1)，因此只暴露两个控制点；x1、x2 必须在 0–1 之间，y 值可越界形成 easeInBack 这类过冲效果。"
      />
    </div>
  );
};

export default CubicBezierGenerator;
