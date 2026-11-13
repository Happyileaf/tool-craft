'use client';

import React from 'react';
import { Alert, Card, InputNumber, Radio, Statistic, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_APERTURE,
  DEFAULT_COC,
  DEFAULT_FOCAL_LENGTH,
  DEFAULT_FOCUS_DISTANCE,
  DEFAULT_TARGET_NEAR,
  UNIT_LABELS,
  UNIT_TO_MM,
  type DistanceUnit,
} from './constants';
import {
  APERTURE_STOPS,
  SENSOR_PRESETS,
  calculateDepthOfField,
  focusDistanceForNearLimit,
  formatDistance,
  hyperfocalDistance,
} from './utils/dof';
import styles from './index.module.css';

/** 工作模式：正向景深计算 / 由目标近界反推对焦距离 */
type Mode = 'dof' | 'reverse';

/** 正向景深计算结果判别联合 */
type DoFOutcome =
  | { ok: true; value: ReturnType<typeof calculateDepthOfField> }
  | { ok: false; error: string };

/** 反推对焦距离结果判别联合 */
type ReverseOutcome = { ok: true; value: number } | { ok: false; error: string };

/**
 * 景深与超焦距计算器：薄透镜光学公式正向计算近 / 远界与景深，并支持由目标近界反推对焦距离
 *
 * @returns 景深计算交互界面
 */
const DepthOfFieldCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('dof');
  const [focalLength, setFocalLength] = React.useState<number | null>(DEFAULT_FOCAL_LENGTH);
  const [aperture, setAperture] = React.useState<number | null>(DEFAULT_APERTURE);
  const [coc, setCoc] = React.useState<number | null>(DEFAULT_COC);
  const [unit, setUnit] = React.useState<DistanceUnit>('m');
  const [focusInput, setFocusInput] = React.useState<number | null>(
    DEFAULT_FOCUS_DISTANCE / UNIT_TO_MM.m,
  );
  const [targetNearInput, setTargetNearInput] = React.useState<number | null>(
    DEFAULT_TARGET_NEAR / UNIT_TO_MM.m,
  );

  const focal = focalLength ?? 0;
  const fStop = aperture ?? 0;
  const circle = coc ?? 0;

  /** 光学参数错误信息（两种模式共用） */
  const opticsError = React.useMemo(() => {
    try {
      hyperfocalDistance(focal, fStop, circle);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '光学参数非法';
    }
  }, [focal, fStop, circle]);

  /** 正向景深结果 */
  const dofResult = React.useMemo<DoFOutcome | null>(() => {
    if (mode !== 'dof' || opticsError !== null || focusInput === null) {
      return null;
    }
    const focusMm = focusInput * UNIT_TO_MM[unit];
    if (!Number.isFinite(focusMm) || focusMm <= 0) {
      return { ok: false, error: '对焦距离必须为大于 0 的数值' };
    }
    try {
      return { ok: true, value: calculateDepthOfField(focal, fStop, focusMm, circle) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [mode, opticsError, focusInput, unit, focal, fStop, circle]);

  /** 反推结果 */
  const reverseResult = React.useMemo<ReverseOutcome | null>(() => {
    if (mode !== 'reverse' || opticsError !== null || targetNearInput === null) {
      return null;
    }
    const targetMm = targetNearInput * UNIT_TO_MM[unit];
    try {
      const focus = focusDistanceForNearLimit(targetMm, focal, fStop, circle);
      return { ok: true, value: focus };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '反推失败' };
    }
  }, [mode, opticsError, targetNearInput, unit, focal, fStop, circle]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">摄影景深</Tag>
        <span className={styles.hint}>
          薄透镜几何光学模型，长度内部统一按毫米计算，H = f² / (N × c)，全程本地运算
        </span>
      </div>

      <Card className={styles.card} title="计算模式" size="small">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
          options={[
            { label: '正向：求景深与超焦距', value: 'dof' },
            { label: '反推：由目标近界求对焦距离', value: 'reverse' },
          ]}
        />
      </Card>

      <Card className={styles.card} title="镜头与传感器参数" size="small">
        <div className={styles.options}>
          <span className={styles.option}>
            <span className={styles.label}>焦距（mm）</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={1}
              max={2000}
              step={1}
              value={focalLength}
              onChange={setFocalLength}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>光圈 f/</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0.5}
              max={128}
              step={0.1}
              value={aperture}
              onChange={setAperture}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>弥散圆（mm）</span>
            <InputNumber<number>
              className={styles.numberInput}
              size="small"
              min={0.001}
              max={0.1}
              step={0.001}
              value={coc}
              onChange={setCoc}
            />
          </span>
          <span className={styles.option}>
            <span className={styles.label}>距离单位</span>
            <Radio.Group
              optionType="button"
              size="small"
              value={unit}
              onChange={(event) => setUnit(event.target.value as DistanceUnit)}
              options={(Object.keys(UNIT_LABELS) as DistanceUnit[]).map((key) => ({
                label: UNIT_LABELS[key],
                value: key,
              }))}
            />
          </span>
        </div>
        <div className={styles.presets}>
          <span className={styles.presetLabel}>画幅预设：</span>
          {SENSOR_PRESETS.map((preset) => (
            <Radio.Button
              key={preset.value}
              checked={coc === preset.value}
              onClick={() => setCoc(preset.value)}
            >
              {preset.label}
            </Radio.Button>
          ))}
        </div>
        <div className={styles.presets}>
          <span className={styles.presetLabel}>光圈档位：</span>
          {APERTURE_STOPS.map((stop) => (
            <Radio.Button
              key={stop}
              checked={fStop === stop}
              onClick={() => setAperture(stop)}
            >
              f/{stop}
            </Radio.Button>
          ))}
        </div>
        {opticsError !== null ? (
          <Alert className={styles.notice} type="error" showIcon message={opticsError} />
        ) : null}
      </Card>

      {mode === 'dof' ? (
        <Card className={styles.card} title="对焦距离与景深结果" size="small">
          <div className={styles.options}>
            <span className={styles.option}>
              <span className={styles.label}>对焦距离（{unit}）</span>
              <InputNumber<number>
                className={styles.numberInput}
                size="small"
                min={0}
                step={unit === 'm' ? 0.1 : 10}
                value={focusInput}
                onChange={setFocusInput}
              />
            </span>
          </div>
          {dofResult && !dofResult.ok ? (
            <Alert className={styles.notice} type="error" showIcon message={dofResult.error} />
          ) : null}
          {dofResult && dofResult.ok ? (
            <div className={styles.statsGrid}>
              <Statistic title="超焦距 H" value={formatDistance(dofResult.value.hyperfocal)} />
              <Statistic title="近界 Dn" value={formatDistance(dofResult.value.nearLimit)} />
              <Statistic title="远界 Df" value={formatDistance(dofResult.value.farLimit)} />
              <Statistic title="景深总深度" value={formatDistance(dofResult.value.depthOfField)} />
              <Statistic title="前景深" value={formatDistance(dofResult.value.frontDepth)} />
              <Statistic title="后景深" value={formatDistance(dofResult.value.rearDepth)} />
            </div>
          ) : null}
        </Card>
      ) : (
        <Card className={styles.card} title="目标近界反推对焦距离" size="small">
          <div className={styles.options}>
            <span className={styles.option}>
              <span className={styles.label}>期望近界（{unit}）</span>
              <InputNumber<number>
                className={styles.numberInput}
                size="small"
                min={0}
                step={unit === 'm' ? 0.1 : 10}
                value={targetNearInput}
                onChange={setTargetNearInput}
              />
            </span>
          </div>
          {reverseResult && !reverseResult.ok ? (
            <Alert
              className={styles.notice}
              type="error"
              showIcon
              message={reverseResult.error}
            />
          ) : null}
          {reverseResult && reverseResult.ok ? (
            <div className={styles.statsGrid}>
              <Statistic
                title="应对焦距离"
                value={formatDistance(reverseResult.value)}
                valueStyle={{ color: '#1677ff' }}
              />
              <Statistic
                title="当前超焦距（近界不可超过）"
                value={formatDistance(hyperfocalDistance(focal, fStop, circle))}
              />
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};

export default DepthOfFieldCalculator;
