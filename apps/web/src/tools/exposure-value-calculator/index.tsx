'use client';

import { Alert, Card, Input, InputNumber, Radio, Select, Space, Table, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_APERTURE,
  DEFAULT_ISO,
  DEFAULT_SHUTTER,
  ISO_PRESETS,
  ND_PRESETS,
  SHUTTER_PRESETS,
} from './constants';
import {
  applyNdFilter,
  calculateExposure,
  equivalentExposures,
  formatLongExposure,
  formatShutter,
  parseShutter,
} from './utils/exposure';
import type { EquivalentPair } from './utils/exposure';
import styles from './index.module.css';

type CalcResult =
  | {
      ok: true;
      ev100: number;
      evIso: number;
      shutterSeconds: number;
    }
  | { ok: false; error: string };

type NdResult =
  | { ok: true; shutterSeconds: number; label: string; timer: string }
  | { ok: false; error: string };

export default function ExposureValueCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [aperture, setAperture] = useState<number | null>(DEFAULT_APERTURE);
  const [shutterText, setShutterText] = useState(defaultInput?.trim() || DEFAULT_SHUTTER);
  const [iso, setIso] = useState<number | null>(DEFAULT_ISO);
  const [step, setStep] = useState<'third' | 'half'>('third');

  const [ndMode, setNdMode] = useState<'apply' | 'reverse'>('apply');
  const [ndStops, setNdStops] = useState<number>(3);
  const [targetShutterText, setTargetShutterText] = useState('30');

  const result = useMemo<CalcResult>(() => {
    try {
      if (aperture === null || iso === null) {
        return { ok: false, error: '请填写完整的光圈与 ISO' };
      }
      const shutterSeconds = parseShutter(shutterText);
      const data = calculateExposure({ aperture, shutterSeconds, iso });
      return { ok: true, ev100: data.ev100, evIso: data.evIso, shutterSeconds };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [aperture, iso, shutterText]);

  const pairs = useMemo<EquivalentPair[]>(() => {
    if (!result.ok) {
      return [];
    }
    return equivalentExposures(result.ev100, step);
  }, [result, step]);

  const ndResult = useMemo<NdResult>(() => {
    try {
      if (ndMode === 'apply') {
        const original = parseShutter(shutterText);
        const next = applyNdFilter(original, ndStops);
        return {
          ok: true,
          shutterSeconds: next,
          label: formatShutter(next),
          timer: formatLongExposure(next),
        };
      }
      const original = parseShutter(shutterText);
      const target = parseShutter(targetShutterText);
      const stops = Math.log2(target / original);
      if (stops < 0) {
        throw new Error('目标快门时间应不小于原快门时间');
      }
      const nearest = ND_PRESETS.reduce<(typeof ND_PRESETS)[number] | null>((best, preset) => {
        if (best === null) {
          return preset;
        }
        return Math.abs(preset.stops - stops) < Math.abs(best.stops - stops) ? preset : best;
      }, null);
      return {
        ok: true,
        shutterSeconds: target,
        label: nearest
          ? `${stops.toFixed(2)} 档（最接近 ${nearest.label}）`
          : `${stops.toFixed(2)} 档`,
        timer: formatLongExposure(target),
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '换算失败' };
    }
  }, [ndMode, ndStops, shutterText, targetShutterText]);

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const lines = [
      `光圈 f/${aperture}`,
      `快门 ${shutterText}`,
      `ISO ${iso}`,
      `EV100 ${result.ev100.toFixed(2)}`,
      `当前 ISO 下 EV ${result.evIso.toFixed(2)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制曝光参数');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="曝光参数">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>光圈 f 值</span>
            <InputNumber
              min={0.5}
              max={64}
              step={0.1}
              value={aperture}
              onChange={setAperture}
              className={styles.control}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>快门时间</span>
            <Input
              value={shutterText}
              onChange={(event) => setShutterText(event.target.value)}
              className={styles.control}
              placeholder="如 1/125 或 2s"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>ISO</span>
            <Select
              showSearch
              value={iso}
              onChange={setIso}
              options={ISO_PRESETS.map((value) => ({ label: String(value), value }))}
              className={styles.control}
            />
          </label>
          <Space wrap>
            {SHUTTER_PRESETS.map((value) => (
              <Tag
                key={value}
                color="blue"
                className={styles.preset}
                onClick={() => {
                  setShutterText(formatShutter(value));
                }}
              >
                {formatShutter(value)}
              </Tag>
            ))}
          </Space>
        </div>

        {result.ok ? (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>EV100</span>
              <span className={styles.value}>{result.ev100.toFixed(2)}</span>
              <span className={styles.sub}>ISO 100 基准</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>当前 ISO 下的 EV</span>
              <span className={styles.value}>{result.evIso.toFixed(2)}</span>
              <span className={styles.sub}>ISO {iso}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>快门（秒）</span>
              <span className={styles.value}>{formatShutter(result.shutterSeconds)}</span>
              <span className={styles.sub}>等效曝光基准</span>
            </div>
          </div>
        ) : (
          <Alert type="warning" showIcon message={result.error} />
        )}

        <Space>
          <button type="button" className={styles.copy} onClick={handleCopy}>
            复制参数
          </button>
        </Space>
      </Card>

      <Card title="ND 滤镜换算">
        <Radio.Group
          value={ndMode}
          onChange={(event) => setNdMode(event.target.value)}
          options={[
            { label: '已知档数 → 新快门', value: 'apply' },
            { label: '已知目标快门 → 档数', value: 'reverse' },
          ]}
          className={styles.modeGroup}
        />
        <div className={styles.inputs}>
          {ndMode === 'apply' ? (
            <label className={styles.field}>
              <span className={styles.label}>ND 滤镜</span>
              <Select
                value={ndStops}
                onChange={setNdStops}
                className={styles.control}
                options={ND_PRESETS.map((preset) => ({
                  label: `${preset.label}（${preset.stops} 档 / 密度 ${preset.density}）`,
                  value: preset.stops,
                }))}
              />
            </label>
          ) : (
            <label className={styles.field}>
              <span className={styles.label}>目标快门时间</span>
              <Input
                value={targetShutterText}
                onChange={(event) => setTargetShutterText(event.target.value)}
                className={styles.control}
                placeholder="如 30 或 60"
              />
            </label>
          )}
        </div>
        {ndResult.ok ? (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{ndMode === 'apply' ? '新快门' : '所需档数'}</span>
              <span className={styles.value}>{ndResult.label}</span>
              <span className={styles.sub}>
                {ndMode === 'apply' ? `长曝光计时 ${ndResult.timer}` : '取最接近的标准 ND'}
              </span>
            </div>
          </div>
        ) : (
          <Alert type="warning" showIcon message={ndResult.error} />
        )}
      </Card>

      <Card
        title="等效曝光组合"
        extra={
          <Radio.Group
            size="small"
            value={step}
            onChange={(event) => setStep(event.target.value)}
            options={[
              { label: '1/3 档', value: 'third' },
              { label: '1/2 档', value: 'half' },
            ]}
          />
        }
      >
        <Table<EquivalentPair>
          size="small"
          rowKey={(row) => row.aperture}
          pagination={false}
          dataSource={pairs}
          columns={[
            { title: '光圈', dataIndex: 'aperture', render: (value: number) => `f/${value}` },
            { title: '快门', dataIndex: 'shutterLabel' },
            {
              title: '快门（秒）',
              dataIndex: 'shutterSeconds',
              render: (value: number) => value.toFixed(4),
            },
          ]}
          scroll={{ y: 320 }}
        />
      </Card>
    </div>
  );
}
