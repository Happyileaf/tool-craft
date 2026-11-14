'use client';

import { Alert, Button, Card, Input, InputNumber, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_INDICATED_SPEED,
  DEFAULT_ORIGINAL_SPEC,
  DEFAULT_REPLACEMENT_SPEC,
  DIAMETER_TOLERANCE_PERCENT,
  TIRE_PRESETS,
} from './constants';
import { compareTires, parseTireSize, tireGeometry } from './utils/tire';
import type { TireComparison, TireGeometry, TireSpec } from './utils/tire';
import styles from './index.module.css';

function toError(error: unknown): string {
  return error instanceof Error ? error.message : '计算失败';
}

function formatNumber(value: number, digits = 1): string {
  return Number(value.toFixed(digits)).toString();
}

type CalcResult =
  | { ok: false; error: string }
  | {
      ok: true;
      original: TireSpec;
      replacement: TireSpec;
      originalGeometry: TireGeometry;
      replacementGeometry: TireGeometry;
      comparison: TireComparison;
    };

export default function TireSizeCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [originalSpec, setOriginalSpec] = useState(defaultInput ?? DEFAULT_ORIGINAL_SPEC);
  const [replacementSpec, setReplacementSpec] = useState(DEFAULT_REPLACEMENT_SPEC);
  const [indicatedSpeed, setIndicatedSpeed] = useState(DEFAULT_INDICATED_SPEED);

  const result = useMemo<CalcResult>(() => {
    try {
      const original = parseTireSize(originalSpec);
      const replacement = parseTireSize(replacementSpec);
      return {
        ok: true,
        original,
        replacement,
        originalGeometry: tireGeometry(original),
        replacementGeometry: tireGeometry(replacement),
        comparison: compareTires(original, replacement, indicatedSpeed),
      };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  }, [originalSpec, replacementSpec, indicatedSpeed]);

  return (
    <div className={styles.container}>
      <Card title="轮胎规格对比">
        <Space wrap className={styles.presets}>
          {TIRE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              onClick={() => {
                setOriginalSpec(preset.original);
                setReplacementSpec(preset.replacement);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Space>

        <div className={styles.inputs}>
          <div className={styles.field}>
            <span className={styles.label}>原厂规格</span>
            <Input
              value={originalSpec}
              onChange={(event) => setOriginalSpec(event.target.value)}
              placeholder="如 205/55R16"
              allowClear
              className={styles.specInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>替换规格</span>
            <Input
              value={replacementSpec}
              onChange={(event) => setReplacementSpec(event.target.value)}
              placeholder="如 225/45R17 91W"
              allowClear
              className={styles.specInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>表显车速（km/h）</span>
            <InputNumber
              min={1}
              max={300}
              value={indicatedSpeed}
              onChange={(value) => setIndicatedSpeed(value ?? DEFAULT_INDICATED_SPEED)}
              style={{ width: 140 }}
            />
          </div>
        </div>

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.stat}>
                <span className={styles.label}>原厂外径</span>
                <span className={styles.value}>
                  {formatNumber(result.originalGeometry.overallDiameterMm)} mm
                </span>
                <span className={styles.sub}>
                  胎侧 {formatNumber(result.originalGeometry.sidewallMm)} mm ·{' '}
                  {formatNumber(result.originalGeometry.revsPerKm, 0)} 转/公里
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>替换外径</span>
                <span className={styles.value}>
                  {formatNumber(result.replacementGeometry.overallDiameterMm)} mm
                </span>
                <span className={styles.sub}>
                  胎侧 {formatNumber(result.replacementGeometry.sidewallMm)} mm ·{' '}
                  {formatNumber(result.replacementGeometry.revsPerKm, 0)} 转/公里
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>外径变化</span>
                <span className={styles.value}>
                  {formatNumber(result.comparison.diameterDeltaMm)} mm（
                  {formatNumber(result.comparison.diameterDeltaPercent, 2)}%）
                </span>
                <span className={styles.sub}>
                  {result.comparison.withinTolerance
                    ? `在 ±${DIAMETER_TOLERANCE_PERCENT}% 推荐范围内`
                    : `超出 ±${DIAMETER_TOLERANCE_PERCENT}% 推荐范围`}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>表显 {indicatedSpeed} km/h 时实际车速</span>
                <span className={styles.value}>
                  {formatNumber(result.comparison.actualSpeedKmh)} km/h
                </span>
                <span className={styles.sub}>
                  速度表误差 {formatNumber(result.comparison.speedErrorPercent, 2)}%
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>胎侧高度变化</span>
                <span className={styles.value}>
                  {formatNumber(result.comparison.sidewallDeltaMm)} mm
                </span>
                <span className={styles.sub}>
                  单侧离地间隙变化 {formatNumber(result.comparison.clearanceDeltaMm)} mm
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>载重指数 / 速度级别</span>
                <span className={styles.value}>
                  {result.original.prefix ? <Tag>{result.original.prefix}</Tag> : null}
                  {result.original.loadIndex ?? '—'} / {result.original.speedRating ?? '—'}
                </span>
                <span className={styles.sub}>
                  替换：{result.replacement.loadIndex ?? '—'} /{' '}
                  {result.replacement.speedRating ?? '—'}
                </span>
              </div>
            </div>

            {!result.comparison.withinTolerance ? (
              <Alert
                type="warning"
                showIcon
                message="外径变化超过推荐范围"
                description={`轮胎外径变化 ${formatNumber(
                  result.comparison.diameterDeltaPercent,
                  2,
                )}%，超出 ±${DIAMETER_TOLERANCE_PERCENT}% 建议范围，可能导致速度表偏差、ABS 与变速箱换挡逻辑异常，请确认轮毂与轮拱间隙。`}
              />
            ) : (
              <Alert
                type="success"
                showIcon
                message="外径变化在推荐范围内"
                description={`外径变化 ${formatNumber(
                  result.comparison.diameterDeltaPercent,
                  2,
                )}%，速度表误差 ${formatNumber(
                  result.comparison.speedErrorPercent,
                  2,
                )}%，可正常使用。`}
              />
            )}
          </>
        )}
      </Card>

      <Card size="small" title="规格说明">
        <ul className={styles.notes}>
          <li>规格格式：宽度 / 扁平比 + 结构 + 轮辋直径，如 205/55R16 表示宽 205 mm、扁平比 55%、子午线结构、16 英寸轮辋。</li>
          <li>外径 = 轮辋直径 × 25.4 + 2 ×（宽度 × 扁平比），速度表实际车速按新旧外径比例换算。</li>
          <li>行业惯例建议替换轮胎外径变化控制在 ±3% 以内，超出后需重新校准速度表与考虑悬挂间隙。</li>
        </ul>
      </Card>
    </div>
  );
}
