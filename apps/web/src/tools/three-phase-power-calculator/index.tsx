'use client';

import { Alert, Button, Card, InputNumber, Radio, Segmented, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { CONNECTION_OPTIONS, PF_PRESETS, POWER_MODE, SCENARIO_PRESETS, type PowerMode } from './constants';
import styles from './index.module.css';
import {
  calculateLineCurrent,
  calculateThreePhasePower,
  calculateTorque,
  toKilo,
  type ConnectionType,
} from './utils/power';

const { Text } = Typography;

/** 数字千分位 + 固定小数 */
function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * 三相交流功率计算器
 *
 * 支持星形 / 三角形接法，在 V_L、I_L、cosφ 与 P 之间双向计算，
 * 并给出相电压、相电流、阻抗角以及电机轴扭矩换算。
 */
export default function ThreePhasePowerCalculator() {
  const [mode, setMode] = useState<PowerMode>(POWER_MODE.POWER);
  const [connection, setConnection] = useState<ConnectionType>('star');

  // 正向输入
  const [lineVoltage, setLineVoltage] = useState<number>(400);
  const [lineCurrent, setLineCurrent] = useState<number>(10);
  const [powerFactor, setPowerFactor] = useState<number>(0.8);

  // 反向输入
  const [targetPower, setTargetPower] = useState<number>(5500);

  // 扭矩面板
  const [rpm, setRpm] = useState<number>(1460);
  const [efficiency, setEfficiency] = useState<number>(90);

  const powerResult = useMemo(() => {
    if (mode !== POWER_MODE.POWER) {
      return null;
    }
    try {
      return calculateThreePhasePower({ lineVoltage, lineCurrent, powerFactor, connection });
    } catch {
      return null;
    }
  }, [mode, lineVoltage, lineCurrent, powerFactor, connection]);

  const currentResult = useMemo(() => {
    if (mode !== POWER_MODE.CURRENT) {
      return null;
    }
    try {
      return calculateLineCurrent({ activePower: targetPower, lineVoltage, powerFactor });
    } catch {
      return null;
    }
  }, [mode, targetPower, lineVoltage, powerFactor]);

  const torque = useMemo(() => {
    if (!powerResult) {
      return null;
    }
    try {
      return calculateTorque(powerResult.activePower, rpm, efficiency / 100);
    } catch {
      return null;
    }
  }, [powerResult, rpm, efficiency]);

  return (
    <div className={styles.container}>
      <Segmented
        block
        value={mode}
        onChange={(value) => setMode((value as PowerMode) ?? POWER_MODE.POWER)}
        options={[
          { label: '由 V/I/cosφ 求功率', value: POWER_MODE.POWER },
          { label: '由目标功率反推电流', value: POWER_MODE.CURRENT },
        ]}
      />

      <div className={styles.presetRow}>
        {SCENARIO_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size="small"
            onClick={() => {
              setMode(POWER_MODE.POWER);
              setLineVoltage(preset.lineVoltage);
              setLineCurrent(preset.lineCurrent);
              setPowerFactor(preset.powerFactor);
              setConnection(preset.connection);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Card size="small" title="输入参数（线电压 / 线电流基准）">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <span className={styles.label}>线电压 V_L</span>
            <InputNumber min={1} value={lineVoltage} onChange={(value) => setLineVoltage(value ?? 400)} addonAfter="V" style={{ width: '100%' }} />
          </div>
          {mode === POWER_MODE.POWER ? (
            <div className={styles.field}>
              <span className={styles.label}>线电流 I_L</span>
              <InputNumber min={0.1} value={lineCurrent} onChange={(value) => setLineCurrent(value ?? 10)} addonAfter="A" style={{ width: '100%' }} />
            </div>
          ) : (
            <div className={styles.field}>
              <span className={styles.label}>目标有功功率 P</span>
              <InputNumber min={1} value={targetPower} onChange={(value) => setTargetPower(value ?? 5500)} addonAfter="W" style={{ width: '100%' }} />
            </div>
          )}
          <div className={styles.field}>
            <span className={styles.label}>功率因数 cosφ</span>
            <InputNumber min={0.01} max={1} step={0.05} value={powerFactor} onChange={(value) => setPowerFactor(value ?? 0.8)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {PF_PRESETS.map((preset) => (
                <Button key={preset.label} size="small" type={powerFactor === preset.value ? 'primary' : 'default'} onClick={() => setPowerFactor(preset.value)}>
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>绕组接法</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={connection}
              onChange={(event) => setConnection(event.target.value as ConnectionType)}
              options={CONNECTION_OPTIONS.map((item) => ({ ...item }))}
            />
          </div>
        </div>
      </Card>

      {mode === POWER_MODE.POWER &&
        (powerResult ? (
          <div className={styles.resultCard}>
            <Space>
              <Tag color="blue">{connection === 'star' ? '星形 Y' : '三角形 Δ'}</Tag>
              <Text type="secondary">三相平衡负载</Text>
            </Space>
            <div className={styles.heroGrid} style={{ marginTop: 14 }}>
              <div className={styles.heroItem}>
                <span className={styles.heroLabel}>有功功率 P</span>
                <span className={styles.heroValue}>
                  {formatNumber(toKilo(powerResult.activePower), 3)}
                  <span className={styles.heroUnit}> kW</span>
                </span>
              </div>
              <div className={styles.heroItem}>
                <span className={styles.heroLabel}>无功功率 Q</span>
                <span className={styles.heroValue}>
                  {formatNumber(toKilo(powerResult.reactivePower), 3)}
                  <span className={styles.heroUnit}> kvar</span>
                </span>
              </div>
              <div className={styles.heroItem}>
                <span className={styles.heroLabel}>视在功率 S</span>
                <span className={styles.heroValue}>
                  {formatNumber(toKilo(powerResult.apparentPower), 3)}
                  <span className={styles.heroUnit}> kVA</span>
                </span>
              </div>
            </div>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>相电压 V_ph</span>
                <span className={styles.metaValue}>{formatNumber(powerResult.phaseVoltage)} V</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>相电流 I_ph</span>
                <span className={styles.metaValue}>{formatNumber(powerResult.phaseCurrent)} A</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>阻抗角 φ</span>
                <span className={styles.metaValue}>{formatNumber(powerResult.phaseAngle)}°</span>
              </div>
            </div>
            <div className={styles.formula}>
              <div>S = √3 · V_L · I_L = √3 × {formatNumber(lineVoltage, 0)} × {formatNumber(lineCurrent)} = {formatNumber(powerResult.apparentPower)} VA</div>
              <div>P = S · cosφ = {formatNumber(powerResult.activePower)} W</div>
              <div>Q = √(S² − P²) = {formatNumber(powerResult.reactivePower)} var</div>
            </div>
          </div>
        ) : (
          <Alert type="error" showIcon message="输入参数无效：电压、电流须为正数，功率因数须在 (0,1] 区间" />
        ))}

      {mode === POWER_MODE.CURRENT &&
        (currentResult !== null ? (
          <div className={styles.resultCard}>
            <div className={styles.heroItem}>
              <span className={styles.heroLabel}>所需线电流 I_L</span>
              <span className={styles.heroValue}>
                {formatNumber(currentResult)}
                <span className={styles.heroUnit}> A</span>
              </span>
            </div>
            <div className={styles.formula}>
              I_L = P / (√3 · V_L · cosφ) = {formatNumber(targetPower, 0)} / (√3 × {formatNumber(lineVoltage, 0)} × {powerFactor})
            </div>
          </div>
        ) : (
          <Alert type="error" showIcon message="输入参数无效，请检查目标功率、电压与功率因数" />
        ))}

      {mode === POWER_MODE.POWER && powerResult && (
        <div className={styles.torquePanel}>
          <Text strong>电机轴扭矩换算（T = 9550 · P_kW / n）</Text>
          <div className={styles.formGrid} style={{ marginTop: 12 }}>
            <div className={styles.field}>
              <span className={styles.label}>转速 n</span>
              <InputNumber min={1} value={rpm} onChange={(value) => setRpm(value ?? 1460)} addonAfter="rpm" style={{ width: '100%' }} />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>电机效率 η</span>
              <InputNumber min={1} max={100} value={efficiency} onChange={(value) => setEfficiency(value ?? 90)} addonAfter="%" style={{ width: '100%' }} />
              <span className={styles.hint}>轴功率 = 输入有功 × η</span>
            </div>
          </div>
          {torque !== null && (
            <div style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary, #1677ff)' }}>
                T = {formatNumber(torque)}
              </Text>
              <span className={styles.heroUnit}> N·m</span>
            </div>
          )}
        </div>
      )}

      <Alert
        type="info"
        showIcon
        message="计算假设三相平衡、正弦稳态且线电压 / 线电流为 RMS 值，全部在浏览器本地完成；实际选型还需考虑谐波、暂态、电机启动电流与线缆压降。"
      />
    </div>
  );
}
