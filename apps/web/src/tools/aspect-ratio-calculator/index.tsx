'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Radio, Tag } from 'antd';
import {
  AspectRatioModeEnum,
  ASPECT_RATIO_MODE_LABELS,
  DEFAULT_HEIGHT,
  DEFAULT_KNOWN_SIDE,
  DEFAULT_RATIO_TEXT,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_WIDTH,
  RESOLVE_TARGET_LABELS,
  ResolveTargetEnum,
  SCALE_TARGET_LABELS,
  ScaleTargetEnum,
} from './constants';
import {
  formatResult,
  matchStandardRatio,
  parsePositive,
  parseRatioText,
  resolveSide,
  scaleByFactor,
  scaleToHeight,
  scaleToWidth,
  simplifyRatio,
} from './utils/aspect-ratio';
import styles from './index.module.css';

/**
 * 宽高比计算器：支持宽高比例化简与常见标准比例识别、
 * 已知比值与一条边补全另一条边、按目标边长或倍数等比缩放，
 * 全部运算在浏览器本地实时完成
 *
 * @returns 宽高比计算器交互界面
 */
const AspectRatioCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<AspectRatioModeEnum>(AspectRatioModeEnum.SIMPLIFY);
  const [width, setWidth] = React.useState(DEFAULT_WIDTH);
  const [height, setHeight] = React.useState(DEFAULT_HEIGHT);
  const [ratioText, setRatioText] = React.useState(DEFAULT_RATIO_TEXT);
  const [resolveTarget, setResolveTarget] = React.useState<ResolveTargetEnum>(
    ResolveTargetEnum.HEIGHT,
  );
  const [knownSide, setKnownSide] = React.useState(DEFAULT_KNOWN_SIDE);
  const [scaleTarget, setScaleTarget] = React.useState<ScaleTargetEnum>(ScaleTargetEnum.WIDTH);
  const [scaleValue, setScaleValue] = React.useState(DEFAULT_WIDTH);
  const [scaleFactor, setScaleFactor] = React.useState(DEFAULT_SCALE_FACTOR);

  const output = React.useMemo<
    | { valid: false }
    | { valid: true; mode: AspectRatioModeEnum.SIMPLIFY; ratio: string; match: { name: string; deviation: number } | null }
    | { valid: true; mode: AspectRatioModeEnum.RESOLVE; resolveTarget: ResolveTargetEnum; value: number }
    | {
        valid: true;
        mode: AspectRatioModeEnum.SCALE;
        scaled: { width: number; height: number };
      }
  >(() => {
    if (mode === AspectRatioModeEnum.SIMPLIFY) {
      const widthValue = parsePositive(width);
      const heightValue = parsePositive(height);
      if (widthValue === null || heightValue === null) {
        return { valid: false };
      }
      const simplified = simplifyRatio(widthValue, heightValue);
      return {
        valid: true,
        mode: AspectRatioModeEnum.SIMPLIFY,
        ratio: `${formatResult(simplified.width)} : ${formatResult(simplified.height)}`,
        match: matchStandardRatio(widthValue, heightValue),
      };
    }

    if (mode === AspectRatioModeEnum.RESOLVE) {
      const ratio = parseRatioText(ratioText);
      const sideValue = parsePositive(knownSide);
      if (ratio === null || sideValue === null) {
        return { valid: false };
      }
      const resolved = resolveSide(ratio.width, ratio.height, resolveTarget, sideValue);
      if (resolved === null) {
        return { valid: false };
      }
      return {
        valid: true,
        mode: AspectRatioModeEnum.RESOLVE,
        resolveTarget,
        value: resolved,
      };
    }

    const sourceWidth = parsePositive(width);
    const sourceHeight = parsePositive(height);
    if (sourceWidth === null || sourceHeight === null) {
      return { valid: false };
    }
    if (scaleTarget === ScaleTargetEnum.FACTOR) {
      const factor = parsePositive(scaleFactor);
      if (factor === null) {
        return { valid: false };
      }
      const result = scaleByFactor(sourceWidth, sourceHeight, factor);
      if (result === null) {
        return { valid: false };
      }
      return { valid: true, mode: AspectRatioModeEnum.SCALE, scaled: result };
    }
    const targetSide = parsePositive(scaleValue);
    if (targetSide === null) {
      return { valid: false };
    }
    const result =
      scaleTarget === ScaleTargetEnum.WIDTH
        ? scaleToWidth(sourceWidth, sourceHeight, targetSide)
        : scaleToHeight(sourceWidth, sourceHeight, targetSide);
    if (result === null) {
      return { valid: false };
    }
    return { valid: true, mode: AspectRatioModeEnum.SCALE, scaled: result };
  }, [
    mode,
    width,
    height,
    ratioText,
    resolveTarget,
    knownSide,
    scaleTarget,
    scaleValue,
    scaleFactor,
  ]);

  return (
    <div className={styles.container}>
      <Card title="宽高比计算器">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as AspectRatioModeEnum)}
          optionType="button"
          buttonStyle="solid"
          options={[
            {
              label: ASPECT_RATIO_MODE_LABELS[AspectRatioModeEnum.SIMPLIFY],
              value: AspectRatioModeEnum.SIMPLIFY,
            },
            {
              label: ASPECT_RATIO_MODE_LABELS[AspectRatioModeEnum.RESOLVE],
              value: AspectRatioModeEnum.RESOLVE,
            },
            {
              label: ASPECT_RATIO_MODE_LABELS[AspectRatioModeEnum.SCALE],
              value: AspectRatioModeEnum.SCALE,
            },
          ]}
        />

        {mode === AspectRatioModeEnum.SIMPLIFY ? (
          <div className={styles.row}>
            <Input
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              addonBefore="宽度"
              style={{ maxWidth: 200 }}
            />
            <span className={styles.label}>×</span>
            <Input
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              addonBefore="高度"
              style={{ maxWidth: 200 }}
            />
          </div>
        ) : mode === AspectRatioModeEnum.RESOLVE ? (
          <div className={styles.row}>
            <Radio.Group
              value={resolveTarget}
              onChange={(event) => setResolveTarget(event.target.value as ResolveTargetEnum)}
              optionType="button"
              options={[
                {
                  label: RESOLVE_TARGET_LABELS[ResolveTargetEnum.WIDTH],
                  value: ResolveTargetEnum.WIDTH,
                },
                {
                  label: RESOLVE_TARGET_LABELS[ResolveTargetEnum.HEIGHT],
                  value: ResolveTargetEnum.HEIGHT,
                },
              ]}
            />
            <Input
              value={ratioText}
              onChange={(event) => setRatioText(event.target.value)}
              addonBefore="比例"
              style={{ maxWidth: 180 }}
            />
            <Input
              value={knownSide}
              onChange={(event) => setKnownSide(event.target.value)}
              addonBefore={
                resolveTarget === ResolveTargetEnum.WIDTH ? '已知高度' : '已知宽度'
              }
              style={{ maxWidth: 200 }}
            />
          </div>
        ) : (
          <>
            <div className={styles.row}>
              <Input
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                addonBefore="原宽度"
                style={{ maxWidth: 200 }}
              />
              <span className={styles.label}>×</span>
              <Input
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                addonBefore="原高度"
                style={{ maxWidth: 200 }}
              />
            </div>
            <div className={styles.row}>
              <Radio.Group
                value={scaleTarget}
                onChange={(event) => setScaleTarget(event.target.value as ScaleTargetEnum)}
                optionType="button"
                options={[
                  {
                    label: SCALE_TARGET_LABELS[ScaleTargetEnum.WIDTH],
                    value: ScaleTargetEnum.WIDTH,
                  },
                  {
                    label: SCALE_TARGET_LABELS[ScaleTargetEnum.HEIGHT],
                    value: ScaleTargetEnum.HEIGHT,
                  },
                  {
                    label: SCALE_TARGET_LABELS[ScaleTargetEnum.FACTOR],
                    value: ScaleTargetEnum.FACTOR,
                  },
                ]}
              />
              {scaleTarget === ScaleTargetEnum.FACTOR ? (
                <Input
                  value={scaleFactor}
                  onChange={(event) => setScaleFactor(event.target.value)}
                  addonAfter="倍"
                  style={{ maxWidth: 180 }}
                />
              ) : (
                <Input
                  value={scaleValue}
                  onChange={(event) => setScaleValue(event.target.value)}
                  addonBefore={
                    scaleTarget === ScaleTargetEnum.WIDTH ? '目标宽度' : '目标高度'
                  }
                  style={{ maxWidth: 200 }}
                />
              )}
            </div>
          </>
        )}

        {!output.valid ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="请输入有效的正数"
            description="宽度、高度、边长与倍数须为大于 0 的数字，比例文本形如 16:9。"
          />
        ) : output.valid && output.mode === AspectRatioModeEnum.SIMPLIFY ? (
          <div className={styles.result}>
            <div className={styles.resultLine}>
              <span className={styles.subtle}>最简整数比</span>
              <span className={styles.resultValue}>{output.ratio}</span>
            </div>
            <div className={styles.resultLine}>
              <span className={styles.subtle}>标准比例</span>
              {output.match ? (
                <Tag color="green">
                  {output.match.name}（误差 {(output.match.deviation * 100).toFixed(2)}%）
                </Tag>
              ) : (
                <Tag>无近似匹配（容差 1%）</Tag>
              )}
            </div>
          </div>
        ) : output.valid && output.mode === AspectRatioModeEnum.RESOLVE ? (
          <div className={styles.result}>
            <div className={styles.resultLine}>
              <span className={styles.subtle}>
                {output.resolveTarget === ResolveTargetEnum.WIDTH ? '补全宽度' : '补全高度'}
              </span>
              <span className={styles.resultValue}>{formatResult(output.value)}</span>
              <span className={styles.resultSuffix}>px</span>
            </div>
          </div>
        ) : output.valid && output.mode === AspectRatioModeEnum.SCALE ? (
          <div className={styles.result}>
            <div className={styles.resultLine}>
              <span className={styles.subtle}>缩放后尺寸</span>
              <span className={styles.resultValue}>
                {formatResult(output.scaled.width)} × {formatResult(output.scaled.height)}
              </span>
              <span className={styles.resultSuffix}>px</span>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default AspectRatioCalculator;
