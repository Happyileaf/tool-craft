'use client';

import { Alert, Button, Card, Input, InputNumber, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_SAMPLE_CODE,
  DEFAULT_TARGET_VALUE,
  PRESET_CODES,
  TARGET_UNIT_OPTIONS,
  UNIT_TO_PF,
} from './constants';
import { encodeCapacitance, formatCapacitance, parseCapacitorCode } from './utils/capacitor';
import type { EncodedCode } from './utils/capacitor';
import styles from './index.module.css';

function toError(error: unknown): string {
  return error instanceof Error ? error.message : '计算失败';
}

export default function CapacitorCodeCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [code, setCode] = useState(defaultInput ?? DEFAULT_SAMPLE_CODE);
  const [targetValue, setTargetValue] = useState(DEFAULT_TARGET_VALUE);
  const [targetUnit, setTargetUnit] = useState('nF');

  const parsed = useMemo(() => {
    try {
      return { data: parseCapacitorCode(code), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  }, [code]);

  const encoded = useMemo<{ data: EncodedCode | null; error: string | null }>(() => {
    try {
      return { data: encodeCapacitance(targetValue * UNIT_TO_PF[targetUnit]), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  }, [targetValue, targetUnit]);

  const formatted = parsed.data ? formatCapacitance(parsed.data.picofarads) : null;
  const range =
    parsed.data && parsed.data.minPf !== null && parsed.data.maxPf !== null
      ? {
          min: formatCapacitance(parsed.data.minPf),
          max: formatCapacitance(parsed.data.maxPf),
        }
      : null;

  return (
    <div className={styles.container}>
      <Card title="电容标码解析">
        <Space wrap className={styles.presets}>
          {PRESET_CODES.map((preset) => (
            <Button key={preset} size="small" onClick={() => setCode(preset)}>
              {preset}
            </Button>
          ))}
        </Space>
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="输入标码，如 104、104K、4R7、2N2、100N、104K1H"
          allowClear
          className={styles.codeInput}
        />

        {parsed.error && <Alert type="error" showIcon message={parsed.error} />}

        {parsed.data && formatted && (
          <>
            <div className={styles.grid}>
              <div className={styles.stat}>
                <span className={styles.label}>容值（pF）</span>
                <span className={styles.value}>{formatted.pf}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>容值（nF）</span>
                <span className={styles.value}>{formatted.nf}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>容值（µF）</span>
                <span className={styles.value}>{formatted.uf}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>容差</span>
                <span className={styles.value}>
                  {parsed.data.tolerance ? (
                    <Tag color="blue">
                      {parsed.data.tolerance.code} {parsed.data.tolerance.label}
                    </Tag>
                  ) : (
                    '未标注'
                  )}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>容差范围</span>
                <span className={styles.value}>
                  {range
                    ? `${range.min.pf} ~ ${range.max.pf} pF`
                    : '未标注容差'}
                </span>
                {range && (
                  <span className={styles.sub}>
                    {range.min.nf} ~ {range.max.nf} nF
                  </span>
                )}
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>额定电压码</span>
                <span className={styles.value}>
                  {parsed.data.voltage ? (
                    <Tag color="green">
                      {parsed.data.voltage.code} · {parsed.data.voltage.volts} V
                    </Tag>
                  ) : (
                    '未标注'
                  )}
                </span>
              </div>
            </div>
            <Alert type="info" showIcon message={parsed.data.explanation} />
          </>
        )}
      </Card>

      <Card title="反查最接近的标准标码">
        <Space wrap align="end">
          <InputNumber
            min={0.0001}
            value={targetValue}
            onChange={(value) => setTargetValue(value ?? DEFAULT_TARGET_VALUE)}
            style={{ width: 160 }}
          />
          <Select
            options={TARGET_UNIT_OPTIONS}
            value={targetUnit}
            onChange={setTargetUnit}
            style={{ width: 100 }}
          />
          <span className={styles.hint}>输入目标容值，自动匹配误差最小的常见标码</span>
        </Space>

        {encoded.error && <Alert type="error" showIcon message={encoded.error} />}

        {encoded.data && (
          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles.label}>最接近标码</span>
              <span className={styles.code}>{encoded.data.code}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>实际容值</span>
              <span className={styles.value}>
                {formatCapacitance(encoded.data.actualPf).pf} pF（
                {formatCapacitance(encoded.data.actualPf).nf} nF）
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>相对误差</span>
              <span className={styles.value}>{encoded.data.errorPercent.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </Card>

      <Card size="small" title="容差字母速查">
        <div className={styles.legend}>
          <span>B ±0.1 pF</span>
          <span>C ±0.25 pF</span>
          <span>D ±0.5 pF</span>
          <span>F ±1%</span>
          <span>G ±2%</span>
          <span>J ±5%</span>
          <span>K ±10%</span>
          <span>M ±20%</span>
          <span>Z +80% / −20%</span>
        </div>
      </Card>
    </div>
  );
}
