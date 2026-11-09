'use client';

import React from 'react';
import { Alert, Button, Card, InputNumber, Select, Space, Tag, message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_INPUT, HINT, LED_COLOR_PRESETS, TOPOLOGY_OPTIONS } from './constants';
import {
  calculateLedResistor,
  formatOhms,
  type LedInput,
  type LedResult,
} from './utils/led';
import styles from './index.module.css';

/** 数值展示：去掉浮点尾差 */
function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return String(value);
  return String(Number(value.toFixed(digits)));
}

/**
 * LED 限流电阻计算器：按欧姆定律求理论电阻、E24 向上选型，
 * 回算实际电流、偏差与电阻功耗，支持单颗 / 串联 / 并联拓扑。
 *
 * @returns LED 限流电阻计算交互界面
 */
const LedResistorCalculator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState<LedInput>(DEFAULT_INPUT);

  const update = <K extends keyof LedInput>(key: K, value: LedInput[K]) => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const result: LedResult = React.useMemo(() => calculateLedResistor(input), [input]);

  const copyResult = () => {
    if (!result.ok) {
      message.warning('当前参数无法计算，暂无可复制的结果');
      return;
    }
    const lines = [
      `拓扑：${TOPOLOGY_OPTIONS.find((item) => item.value === input.topology)?.label ?? input.topology}`,
      `理论电阻：${formatOhms(result.theoreticalOhms)}（${formatNumber(result.theoreticalOhms, 2)} Ω）`,
      `推荐 E24 标称电阻：${formatOhms(result.nominalOhms)}`,
      `实际电流：${formatNumber(result.actualCurrentMa)} mA（偏差 ${formatNumber(result.currentDeviationPct, 2)}%）`,
      `电阻功耗：${formatNumber(result.resistorPowerW, 4)} W，建议额定功率：${result.ratedPowerW} W`,
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  return (
    <div className={styles.container}>
      <Card
        title="LED 限流电阻计算器（欧姆定律 · E24 选型 · 功耗估算）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>{HINT}</p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>电源电压 Vs（V）</div>
            <InputNumber
              className={styles.fullWidth}
              min={0}
              step={0.5}
              value={input.supplyVoltage}
              onChange={(value) => update('supplyVoltage', value === null ? 0 : Number(value))}
            />
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>LED 正向压降 Vf（V）</div>
            <InputNumber
              className={styles.fullWidth}
              min={0}
              step={0.1}
              value={input.forwardVoltage}
              onChange={(value) => update('forwardVoltage', value === null ? 0 : Number(value))}
            />
            <Space wrap size={4} style={{ marginTop: 8 }}>
              {LED_COLOR_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  type={input.forwardVoltage === preset.forwardVoltage ? 'primary' : 'default'}
                  onClick={() => update('forwardVoltage', preset.forwardVoltage)}
                >
                  {preset.label}
                </Button>
              ))}
            </Space>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>期望电流 If（mA）</div>
            <InputNumber
              className={styles.fullWidth}
              min={0}
              step={5}
              value={input.currentMa}
              onChange={(value) => update('currentMa', value === null ? 0 : Number(value))}
            />
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>LED 拓扑</div>
            <Select
              className={styles.fullWidth}
              value={input.topology}
              options={TOPOLOGY_OPTIONS}
              onChange={(value) => update('topology', value)}
            />
            {input.topology === 'series' ? (
              <InputNumber
                className={styles.fullWidth}
                style={{ marginTop: 8 }}
                min={1}
                precision={0}
                addonBefore="串联颗数"
                value={input.seriesCount}
                onChange={(value) => update('seriesCount', value === null ? 1 : Number(value))}
              />
            ) : null}
            {input.topology === 'parallel' ? (
              <InputNumber
                className={styles.fullWidth}
                style={{ marginTop: 8 }}
                min={1}
                precision={0}
                addonBefore="并联支路数"
                value={input.parallelCount}
                onChange={(value) => update('parallelCount', value === null ? 1 : Number(value))}
              />
            ) : null}
          </div>
        </div>

        <Space style={{ marginTop: 16 }}>
          <Button size="small" onClick={() => setInput(DEFAULT_INPUT)}>
            重置为示例（5V / 红 LED / 20mA）
          </Button>
        </Space>

        {!result.ok ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="参数无法计算"
            description={result.error ?? '未知错误'}
          />
        ) : (
          <div style={{ marginTop: 16 }}>
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag color="blue">E24 向上选型 · 防过流</Tag>
              <Tag color={result.currentDeviationPct <= 0 ? 'green' : 'orange'}>
                电流偏差 {formatNumber(result.currentDeviationPct, 2)}%
              </Tag>
              <Tag>建议额定功率 {result.ratedPowerW} W（≥2 倍冗余）</Tag>
            </Space>
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <div className={styles.resultLabel}>理论电阻</div>
                <div className={styles.resultValue}>{formatOhms(result.theoreticalOhms)}</div>
              </div>
              <div className={styles.resultItem}>
                <div className={styles.resultLabel}>推荐 E24 标称电阻</div>
                <div className={styles.resultValue}>{formatOhms(result.nominalOhms)}</div>
              </div>
              <div className={styles.resultItem}>
                <div className={styles.resultLabel}>实际电流</div>
                <div className={styles.resultValue}>{formatNumber(result.actualCurrentMa)} mA</div>
              </div>
              <div className={styles.resultItem}>
                <div className={styles.resultLabel}>电阻功耗 P=I²R</div>
                <div className={styles.resultValue}>{formatNumber(result.resistorPowerW, 4)} W</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LedResistorCalculator;
