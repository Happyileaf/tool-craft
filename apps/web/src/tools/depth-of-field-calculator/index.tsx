'use client';

import { Alert, Card, InputNumber, Select, Space, Tag, message, Button } from 'antd';
import { useMemo, useState } from 'react';
import {
  COC_PRESETS,
  DEFAULT_DOF_INPUT,
  DEFAULT_TARGET_DEPTH,
  LENGTH_UNIT_OPTIONS,
  UNIT_TO_MM,
  type LengthUnit,
} from './constants';
import {
  calculateDof,
  convertLength,
  formatLength,
  solveApertureForDepthOfField,
  validateDofInput,
} from './utils/dof';
import styles from './index.module.css';

export default function DepthOfFieldCalculatorTool() {
  const [focalLength, setFocalLength] = useState(DEFAULT_DOF_INPUT.focalLength);
  const [aperture, setAperture] = useState(DEFAULT_DOF_INPUT.aperture);
  const [subjectValue, setSubjectValue] = useState(DEFAULT_DOF_INPUT.subjectDistance);
  const [distanceUnit, setDistanceUnit] = useState<LengthUnit>(DEFAULT_DOF_INPUT.distanceUnit);
  const [coc, setCoc] = useState(DEFAULT_DOF_INPUT.coc);
  const [resultUnit, setResultUnit] = useState<LengthUnit>(DEFAULT_DOF_INPUT.resultUnit);
  const [targetDepth, setTargetDepth] = useState(DEFAULT_TARGET_DEPTH);
  const [targetUnit, setTargetUnit] = useState<LengthUnit>('m');

  const subjectDistanceMm = subjectValue * UNIT_TO_MM[distanceUnit];

  const evaluation = useMemo(() => {
    const input = { focalLength, aperture, subjectDistance: subjectDistanceMm, coc };
    const message = validateDofInput(input);
    if (message) {
      return { result: null, error: message };
    }
    try {
      return { result: calculateDof(input), error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : '计算失败',
      };
    }
  }, [focalLength, aperture, subjectDistanceMm, coc]);

  const solvedAperture = useMemo(() => {
    if (!targetDepth || targetDepth <= 0) {
      return null;
    }
    return solveApertureForDepthOfField({
      focalLength,
      subjectDistance: subjectDistanceMm,
      coc,
      targetDepthMm: targetDepth * UNIT_TO_MM[targetUnit],
    });
  }, [focalLength, subjectDistanceMm, coc, targetDepth, targetUnit]);

  const result = evaluation.result;

  const copySummary = async () => {
    if (!result) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const lines = [
      `焦距 ${focalLength} mm，光圈 f/${aperture}，对焦 ${subjectValue} ${distanceUnit}，CoC ${coc} mm`,
      `超焦距 H：${formatLength(result.hyperfocalMm, resultUnit)}`,
      `近景深 Dn：${formatLength(result.nearMm, resultUnit)}`,
      `远景深 Df：${formatLength(result.farMm, resultUnit)}`,
      `总景深：${result.totalMm === null ? '∞' : formatLength(result.totalMm, resultUnit)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  const macroNotice = subjectValue * UNIT_TO_MM[distanceUnit] < focalLength * 5;

  return (
    <div className={styles.container}>
      <Card title="镜头参数">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>焦距（mm）</span>
            <InputNumber
              className={styles.number}
              min={1}
              max={2000}
              value={focalLength}
              onChange={(value) => setFocalLength(value ?? 50)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>光圈 f 值</span>
            <InputNumber
              className={styles.number}
              min={0.5}
              max={64}
              step={0.1}
              value={aperture}
              onChange={(value) => setAperture(value ?? 8)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>对焦距离</span>
            <Space.Compact className={styles.compact}>
              <InputNumber
                className={styles.number}
                min={0}
                value={subjectValue}
                onChange={(value) => setSubjectValue(value ?? 0)}
              />
              <Select
                options={LENGTH_UNIT_OPTIONS}
                value={distanceUnit}
                onChange={(value: LengthUnit) => setDistanceUnit(value)}
              />
            </Space.Compact>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>弥散圆 CoC 预设</span>
            <Select
              options={COC_PRESETS.map((preset) => ({
                label: preset.label,
                value: preset.value,
              }))}
              value={coc}
              onChange={(value: number) => setCoc(value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>自定义 CoC（mm）</span>
            <InputNumber
              className={styles.number}
              min={0.001}
              max={1}
              step={0.001}
              value={coc}
              onChange={(value) => setCoc(value ?? 0.03)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>结果单位</span>
            <Select
              options={LENGTH_UNIT_OPTIONS}
              value={resultUnit}
              onChange={(value: LengthUnit) => setResultUnit(value)}
            />
          </label>
        </div>
        {macroNotice && (
          <Alert
            className={styles.notice}
            type="info"
            showIcon
            message="对焦距离接近焦距，已进入微距近似区间，薄透镜公式误差会明显增大。"
          />
        )}
      </Card>

      {evaluation.error && <Alert type="error" showIcon message={evaluation.error} />}

      {result && (
        <Card
          title="景深结果"
          extra={
            <Space>
              <Tag color="blue">H = f²/(N·c) + f = {formatLength(result.hyperfocalMm, resultUnit)}</Tag>
              <Button onClick={copySummary}>复制结果</Button>
            </Space>
          }
        >
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>近景深 Dn</span>
              <span className={styles.statValue}>{formatLength(result.nearMm, resultUnit)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>远景深 Df</span>
              <span className={styles.statValue}>{formatLength(result.farMm, resultUnit)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>总景深</span>
              <span className={styles.statValue}>
                {result.totalMm === null ? '∞' : formatLength(result.totalMm, resultUnit)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>超焦距 H</span>
              <span className={styles.statValue}>
                {formatLength(result.hyperfocalMm, resultUnit)}
              </span>
            </div>
          </div>
          {result.totalMm !== null && (
            <div className={styles.fractionBar}>
              <div
                className={styles.fractionFront}
                style={{
                  width: `${Math.min(100, (result.frontMm / result.totalMm) * 100)}%`,
                }}
              />
              <span className={styles.fractionText}>
                前景深 {convertLength(result.frontMm, resultUnit).toFixed(2)} {resultUnit} · 后景深{' '}
                {convertLength(result.rearMm as number, resultUnit).toFixed(2)} {resultUnit}
              </span>
            </div>
          )}
        </Card>
      )}

      <Card title="反求光圈（目标景深 → 所需光圈）">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>目标总景深</span>
            <Space.Compact className={styles.compact}>
              <InputNumber
                className={styles.number}
                min={0}
                value={targetDepth}
                onChange={(value) => setTargetDepth(value ?? 0)}
              />
              <Select
                options={LENGTH_UNIT_OPTIONS}
                value={targetUnit}
                onChange={(value: LengthUnit) => setTargetUnit(value)}
              />
            </Space.Compact>
          </label>
          <div className={styles.field}>
            <span className={styles.label}>求解结果</span>
            <span className={styles.solveValue}>
              {solvedAperture === null ? '在 f/0.5 – f/64 内无解' : `f/${solvedAperture}`}
            </span>
          </div>
        </div>
        {solvedAperture !== null && (
          <p className={styles.hint}>
            在焦距 {focalLength} mm、对焦 {subjectValue} {distanceUnit}、CoC {coc} mm 下，使用 f/
            {solvedAperture} 可获得约 {targetDepth} {targetUnit} 的总景深。
          </p>
        )}
      </Card>
    </div>
  );
}
