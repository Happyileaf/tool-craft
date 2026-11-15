'use client';

import { Alert, Button, Card, InputNumber, Segmented, Select, Space, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  ANTENNA_TYPES,
  calculateAntennaLengths,
  formatLength,
  frequencyFromLength,
} from './utils/antenna';
import type { AntennaResult, AntennaType } from './utils/antenna';
import styles from './index.module.css';

type Mode = 'frequency' | 'length';

const FREQUENCY_PRESETS = [
  { label: '27.185 MHz', value: 27.185 },
  { label: '145.5 MHz', value: 145.5 },
  { label: '433.92 MHz', value: 433.92 },
  { label: '868 MHz', value: 868 },
  { label: '915 MHz', value: 915 },
  { label: '2.4 GHz', value: 2400 },
];

type CalcResult =
  | { ok: true; mode: 'frequency'; data: AntennaResult }
  | { ok: true; mode: 'length'; frequency: number }
  | { ok: false; error: string };

export default function AntennaLengthCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('frequency');
  const [frequency, setFrequency] = useState(defaultInput ? Number(defaultInput) || 145 : 145);
  const [velocityFactor, setVelocityFactor] = useState(1);
  const [lengthMeters, setLengthMeters] = useState(0.986);
  const [antennaType, setAntennaType] = useState<AntennaType>('dipole');

  const result = useMemo<CalcResult>(() => {
    try {
      if (mode === 'frequency') {
        return { ok: true, mode: 'frequency', data: calculateAntennaLengths(frequency, velocityFactor) };
      }
      return {
        ok: true,
        mode: 'length',
        frequency: frequencyFromLength(lengthMeters, antennaType, velocityFactor),
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [mode, frequency, velocityFactor, lengthMeters, antennaType]);

  const handleCopy = async () => {
    if (!result.ok) {
      message.warning('当前没有可复制的结果');
      return;
    }
    let text = '';
    if (result.mode === 'frequency') {
      const data = result.data;
      text = [
        `频率：${data.frequencyMhz} MHz，速度因子：${data.velocityFactor}`,
        `自由空间波长：${formatLength(data.wavelengthMeters)} m / ${formatLength(data.wavelengthFeet)} ft`,
        ...data.antennas.map(
          (antenna) =>
            `${antenna.label}：${formatLength(antenna.lengthMeters)} m / ${formatLength(antenna.lengthFeet)} ft`,
        ),
      ].join('\n');
    } else {
      text = `谐振频率：${formatLength(result.frequency)} MHz`;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="天线长度换算">
        <Segmented
          className={styles.modeRow}
          value={mode}
          onChange={(value) => setMode(value as Mode)}
          options={[
            { label: '频率 → 长度', value: 'frequency' },
            { label: '长度 → 频率', value: 'length' },
          ]}
        />

        <div className={styles.inputs}>
          {mode === 'frequency' ? (
            <label className={styles.field}>
              <span className={styles.label}>工作频率（MHz）</span>
              <InputNumber
                min={0.1}
                max={6000}
                value={frequency}
                onChange={(value) => setFrequency(value ?? 145)}
                style={{ width: 160 }}
              />
            </label>
          ) : (
            <>
              <label className={styles.field}>
                <span className={styles.label}>天线长度（米）</span>
                <InputNumber
                  min={0.001}
                  value={lengthMeters}
                  onChange={(value) => setLengthMeters(value ?? 1)}
                  style={{ width: 160 }}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>天线类型</span>
                <Select
                  value={antennaType}
                  onChange={setAntennaType}
                  options={ANTENNA_TYPES.map((antenna) => ({ label: antenna.label, value: antenna.value }))}
                  style={{ width: 240 }}
                />
              </label>
            </>
          )}
          <label className={styles.field}>
            <span className={styles.label}>速度因子（0.50–1.00）</span>
            <InputNumber
              min={0.5}
              max={1}
              step={0.01}
              value={velocityFactor}
              onChange={(value) => setVelocityFactor(value ?? 1)}
              style={{ width: 140 }}
            />
          </label>
        </div>

        {mode === 'frequency' ? (
          <div className={styles.presets}>
            <span className={styles.label}>常用频段：</span>
            {FREQUENCY_PRESETS.map((preset) => (
              <Button key={preset.label} size="small" onClick={() => setFrequency(preset.value)}>
                {preset.label}
              </Button>
            ))}
          </div>
        ) : null}

        {!result.ok ? (
          <Alert type="error" showIcon message={result.error} />
        ) : result.mode === 'frequency' ? (
          <>
            <div className={styles.wavelength}>
              <span className={styles.label}>自由空间波长 λ</span>
              <div className={styles.wavelengthValues}>
                <span className={styles.value}>{formatLength(result.data.wavelengthMeters)} m</span>
                <span className={styles.value}>{formatLength(result.data.wavelengthFeet)} ft</span>
              </div>
              <span className={styles.sub}>
                λ = 300 / f，已按速度因子 {result.data.velocityFactor} 缩放
              </span>
            </div>

            <div className={styles.cards}>
              {result.data.antennas.map((antenna) => (
                <div key={antenna.type} className={styles.card}>
                  <span className={styles.cardTitle}>{antenna.label}</span>
                  <span className={styles.cardValue}>{formatLength(antenna.lengthMeters)} m</span>
                  <span className={styles.sub}>{formatLength(antenna.lengthFeet)} ft</span>
                  <span className={styles.note}>{antenna.note}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleCopy}>复制全部长度</Button>
          </>
        ) : (
          <>
            <div className={styles.wavelength}>
              <span className={styles.label}>谐振频率</span>
              <span className={styles.value}>{formatLength(result.frequency)} MHz</span>
              <span className={styles.sub}>
                按 {ANTENNA_TYPES.find((antenna) => antenna.value === antennaType)?.label} 与速度因子{' '}
                {velocityFactor} 反推
              </span>
            </div>
            <Space wrap>
              <Button onClick={handleCopy}>复制结果</Button>
              <Button onClick={() => setFrequency(Math.round(result.frequency * 1000) / 1000)}>
                用该频率正推长度
              </Button>
            </Space>
          </>
        )}
      </Card>

      <Card size="small" title="计算说明">
        <ul className={styles.notes}>
          <li>频率与波长的关系为 λ(m) = 300 / f(MHz)，英尺换算使用 1 m = 3.28084 ft。</li>
          <li>半波偶极子与四分之一波长公式已包含端效应缩短系数；速度因子用于涂覆导线、同轴电缆等介质中的额外缩短。</li>
          <li>天线实际谐振频率受架设高度、周围物体与地网影响，计算结果建议用驻波表实测微调。</li>
        </ul>
      </Card>
    </div>
  );
}
