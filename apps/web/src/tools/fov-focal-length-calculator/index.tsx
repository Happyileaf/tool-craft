'use client';

import { Alert, Card, InputNumber, Radio, Select, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_APERTURE,
  DEFAULT_FOCAL,
  DEFAULT_SENSOR_KEY,
  FOV_DIMENSIONS,
  SENSOR_PRESETS,
} from './constants';
import type { FovDimension } from './constants';
import {
  calculateFov,
  compareSensors,
  cropFactorFromSize,
  dimensionLabel,
  dimensionSize,
  focalFromFov,
  sensorDiagonal,
} from './utils/fov';
import type { SensorComparisonRow } from './utils/fov';
import styles from './index.module.css';

type Mode = 'forward' | 'reverse';

export default function FovFocalLengthCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('forward');
  const [sensorKey, setSensorKey] = useState(defaultInput?.trim() || DEFAULT_SENSOR_KEY);
  const [width, setWidth] = useState<number | null>(36);
  const [height, setHeight] = useState<number | null>(24);
  const [focal, setFocal] = useState<number | null>(DEFAULT_FOCAL);
  const [aperture, setAperture] = useState<number | null>(DEFAULT_APERTURE);
  const [dimension, setDimension] = useState<FovDimension>('diagonal');
  const [targetFov, setTargetFov] = useState<number | null>(60);

  const isCustom = sensorKey === 'custom';
  const preset = SENSOR_PRESETS.find((item) => item.key === sensorKey);

  const sensorSize = useMemo(() => {
    if (isCustom || !preset) {
      return { width: width ?? 0, height: height ?? 0 };
    }
    return { width: preset.width, height: preset.height };
  }, [isCustom, preset, width, height]);

  const forwardResult = useMemo(() => {
    try {
      if (focal === null || aperture === null) {
        return { ok: false as const, error: '请填写焦距与光圈' };
      }
      const data = calculateFov(
        sensorSize,
        focal,
        aperture,
        isCustom ? undefined : preset?.cropFactor,
      );
      return { ok: true as const, data };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [aperture, focal, isCustom, preset, sensorSize]);

  const reverseResult = useMemo(() => {
    try {
      if (targetFov === null) {
        return { ok: false as const, error: '请输入目标视角' };
      }
      const size = dimensionSize(sensorSize, dimension);
      return { ok: true as const, focal: focalFromFov(targetFov, size) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [dimension, sensorSize, targetFov]);

  const comparison = useMemo<SensorComparisonRow[] | null>(() => {
    if (focal === null || focal <= 0) {
      return null;
    }
    try {
      return compareSensors(focal);
    } catch {
      return null;
    }
  }, [focal]);

  const cropDisplay = useMemo(() => {
    try {
      return isCustom ? cropFactorFromSize(sensorSize.width, sensorSize.height).toFixed(2) : preset?.cropFactor.toFixed(2) ?? '—';
    } catch {
      return '—';
    }
  }, [isCustom, preset, sensorSize]);

  const updateSensor = (key: string) => {
    setSensorKey(key);
    const next = SENSOR_PRESETS.find((item) => item.key === key);
    if (next) {
      setWidth(next.width);
      setHeight(next.height);
    }
    if (key === 'custom' && preset) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="画幅与镜头参数">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          options={[
            { label: '焦距 → 视角', value: 'forward' },
            { label: '目标视角 → 焦距', value: 'reverse' },
          ]}
          className={styles.modeGroup}
        />

        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>传感器画幅</span>
            <Select
              value={sensorKey}
              onChange={updateSensor}
              className={styles.sensorSelect}
              options={[
                ...SENSOR_PRESETS.map((item) => ({ label: item.label, value: item.key })),
                { label: '自定义尺寸', value: 'custom' },
              ]}
            />
          </label>

          {isCustom ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>宽度（mm）</span>
                <InputNumber min={0.1} step={0.1} value={width} onChange={setWidth} className={styles.control} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>高度（mm）</span>
                <InputNumber min={0.1} step={0.1} value={height} onChange={setHeight} className={styles.control} />
              </label>
            </>
          ) : null}

          {mode === 'forward' ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>焦距（mm）</span>
                <InputNumber min={0.1} step={1} value={focal} onChange={setFocal} className={styles.control} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>光圈 f 值</span>
                <InputNumber min={0.1} step={0.1} value={aperture} onChange={setAperture} className={styles.control} />
              </label>
            </>
          ) : (
            <>
              <label className={styles.field}>
                <span className={styles.label}>视角维度</span>
                <Select
                  value={dimension}
                  onChange={setDimension}
                  className={styles.control}
                  options={FOV_DIMENSIONS.map((item) => ({ label: item.label, value: item.value }))}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>目标视角（度）</span>
                <InputNumber min={0.1} max={179.9} step={1} value={targetFov} onChange={setTargetFov} className={styles.control} />
              </label>
            </>
          )}
        </div>

        <div className={styles.meta}>
          <Tag color="blue">裁切系数 {cropDisplay}</Tag>
          <Tag>对角线 {safeDiagonal(sensorSize.width, sensorSize.height)}</Tag>
        </div>

        {mode === 'forward' ? (
          forwardResult.ok ? (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>对角线视角</span>
                <span className={styles.value}>{forwardResult.data.diagonalFov.toFixed(2)}°</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>水平视角</span>
                <span className={styles.value}>{forwardResult.data.horizontalFov.toFixed(2)}°</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>垂直视角</span>
                <span className={styles.value}>{forwardResult.data.verticalFov.toFixed(2)}°</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>35mm 等效焦距</span>
                <span className={styles.value}>{forwardResult.data.equivalentFocal.toFixed(1)} mm</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>等效光圈</span>
                <span className={styles.value}>f/{forwardResult.data.equivalentAperture.toFixed(1)}</span>
              </div>
            </div>
          ) : (
            <Alert type="warning" showIcon message={forwardResult.error} />
          )
        ) : reverseResult.ok ? (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{dimensionLabel(dimension)}</span>
              <span className={styles.value}>{targetFov}°</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>所需焦距</span>
              <span className={styles.value}>{reverseResult.focal.toFixed(1)} mm</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>35mm 等效焦距</span>
              <span className={styles.value}>
                {(reverseResult.focal * (Number(cropDisplay) || 1)).toFixed(1)} mm
              </span>
            </div>
          </div>
        ) : (
          <Alert type="warning" showIcon message={reverseResult.error} />
        )}
      </Card>

      <Card title="同一焦距下的画幅视角对比">
        <Table<SensorComparisonRow>
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={comparison ?? []}
          locale={{ emptyText: '请输入有效焦距' }}
          columns={[
            { title: '画幅', dataIndex: 'label' },
            { title: '裁切系数', dataIndex: 'cropFactor', render: (value: number) => value.toFixed(2) },
            {
              title: '对角线视角',
              dataIndex: 'diagonalFov',
              render: (value: number) => `${value.toFixed(2)}°`,
            },
            {
              title: '水平视角',
              dataIndex: 'horizontalFov',
              render: (value: number) => `${value.toFixed(2)}°`,
            },
            {
              title: '等效焦距',
              dataIndex: 'equivalentFocal',
              render: (value: number) => `${value.toFixed(1)} mm`,
            },
          ]}
        />
      </Card>
    </div>
  );
}

function safeDiagonal(width: number, height: number): string {
  try {
    return `${sensorDiagonal(width, height).toFixed(2)} mm`;
  } catch {
    return '—';
  }
}
