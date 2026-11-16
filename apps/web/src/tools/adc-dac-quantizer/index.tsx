'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Radio, Space, Table, Tag, message } from 'antd';
import {
  getOverview,
  voltageToCode,
  codeToVoltage,
  sinadToEnob,
  type Polarity,
  type RoundingMode,
  type QuantizerParams,
} from './utils/quantizer';
import { BIT_PRESETS, POLARITY_OPTIONS, ROUNDING_OPTIONS, DEFAULT_PARAMS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

function sci(value: number, digits = 6): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e-3 && abs < 1e7) return Number(value.toFixed(digits)).toString();
  return value.toExponential(4);
}

const AdcDacQuantizer: React.FC<ToolComponentProps> = () => {
  const [bits, setBits] = React.useState<number>(DEFAULT_PARAMS.bits);
  const [vref, setVref] = React.useState<number>(DEFAULT_PARAMS.vref);
  const [polarity, setPolarity] = React.useState<Polarity>(DEFAULT_PARAMS.polarity);
  const [rounding, setRounding] = React.useState<RoundingMode>('round');
  const [voltage, setVoltage] = React.useState<number | null>(1.65);
  const [codeInput, setCodeInput] = React.useState<string>('2048');
  const [sinad, setSinad] = React.useState<number | null>(72.24);

  const params: QuantizerParams = React.useMemo(
    () => ({ bits, vref, polarity }),
    [bits, vref, polarity],
  );

  const overview = React.useMemo<
    { data: ReturnType<typeof getOverview>; error?: undefined } | { data?: undefined; error: string }
  >(() => {
    try {
      return { data: getOverview(params) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [params]);

  const voltageResult = React.useMemo<
    | { kind: 'ok'; data: ReturnType<typeof voltageToCode> }
    | { kind: 'error'; errorMessage: string }
    | undefined
  >(() => {
    if (voltage === null || !overview.data) return undefined;
    try {
      return { kind: 'ok', data: voltageToCode(params, voltage, rounding) };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [params, voltage, rounding, overview.data]);

  const codeResult = React.useMemo<
    | { kind: 'ok'; data: ReturnType<typeof codeToVoltage> }
    | { kind: 'error'; errorMessage: string }
    | undefined
  >(() => {
    if (!overview.data || codeInput.trim() === '') return undefined;
    try {
      return { kind: 'ok', data: codeToVoltage(params, codeInput.trim()) };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [params, codeInput, overview.data]);

  const enob = React.useMemo(() => {
    if (sinad === null) return undefined;
    try {
      return sinadToEnob(sinad);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, [sinad]);

  const handleCopy = () => {
    if (!overview.data) {
      message.warning('参数无效，暂无可复制的结果');
      return;
    }
    const o = overview.data;
    copyToClipboard(
      [
        `N=${bits} 位, Vref=${vref} V, ${polarity === 'unipolar' ? '单极性' : '双极性'}`,
        `码值总数=${o.codeCount}, 满幅码=${o.maxCode}`,
        `LSB=${sci(o.lsb)} V, 满幅输出=${sci(o.fullScaleOutput)} V`,
        `理想 SNR=${sci(o.snrDb, 2)} dB, 量化噪声 RMS=${sci(o.quantizationNoiseRms)} V`,
      ].join('\n'),
    );
    message.success('参数总览已复制');
  };

  const metricCards = overview.data
    ? [
        { label: '码值总数 2^N', value: overview.data.codeCount },
        { label: '满幅码 2^N−1', value: overview.data.maxCode },
        { label: 'LSB 步进电压', value: `${sci(overview.data.lsb)} V` },
        { label: '满幅输出电压', value: `${sci(overview.data.fullScaleOutput)} V` },
        { label: '理想 SNR', value: `${sci(overview.data.snrDb, 2)} dB` },
        { label: '量化噪声 RMS', value: `${sci(overview.data.quantizationNoiseRms)} V` },
        { label: '峰值量化误差', value: `${sci(overview.data.peakError)} V（½ LSB）` },
        { label: '满量程跨度', value: `${sci(overview.data.span)} V` },
      ]
    : [];

  const transferColumns = [
    { title: '方向', dataIndex: 'direction', key: 'direction', width: 140 },
    { title: '输入', dataIndex: 'input', key: 'input' },
    { title: '输出', dataIndex: 'output', key: 'output' },
  ];

  const transferRows = [];
  if (overview.data) {
    if (voltageResult?.kind === 'ok') {
      const v = voltageResult.data;
      transferRows.push({
        key: 'v2c',
        direction: '电压 → 码值',
        input: `${voltage} V（${rounding === 'round' ? '四舍五入' : '向下截断'}）`,
        output: (
          <Space direction="vertical" size={0}>
            <span className={styles.mono}>
              code = {v.code}（hex 0x{v.hex}）
              {v.clipped ? <Tag color="orange">超量程夹取</Tag> : null}
            </span>
            <span className={styles.hint}>
              还原电压 {sci(v.reconstructedVoltage)} V，误差 {sci(v.error)} V（
              {sci(v.errorInLsb, 3)} LSB）
            </span>
          </Space>
        ),
      });
    }
    if (codeResult?.kind === 'ok') {
      const c = codeResult.data;
      transferRows.push({
        key: 'c2v',
        direction: '码值 → 电压',
        input: `code = ${codeInput}`,
        output: (
          <Space direction="vertical" size={0}>
            <span className={styles.mono}>
              Vout = {sci(c.voltage)} V
              {polarity === 'bipolar' ? <Tag>有符号码 {c.signedCode}</Tag> : null}
            </span>
          </Space>
        ),
      });
    }
  }

  return (
    <div className={styles.container}>
      <Card
        title="ADC / DAC 量化参数计算器（分辨率 / LSB / 量化误差 / SNR / 电压码值互算）"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制总览
          </Button>
        }
      >
        <p className={styles.hint}>
          面向单片机 ADC 配置与数据采集评估：输入分辨率位数 N（1–32）、参考电压 Vref 与极性，即得 LSB、满幅码、理想
          SNR 与量化噪声；支持电压↔码值双向互算。N&gt;24 的码值整数用 BigInt 精确处理，全部计算在浏览器本地完成。
        </p>

        <Space wrap size="middle" style={{ marginBottom: 12 }}>
          <span>
            分辨率 N（位）：
            <InputNumber
              min={1}
              max={32}
              precision={0}
              value={bits}
              onChange={(value) => setBits(value === null ? DEFAULT_PARAMS.bits : Number(value))}
              style={{ width: 90 }}
            />
          </span>
          <Space size={4}>
            {BIT_PRESETS.map((preset) => (
              <Button key={preset} size="small" type={bits === preset ? 'primary' : 'default'} onClick={() => setBits(preset)}>
                {preset} 位
              </Button>
            ))}
          </Space>
          <span>
            Vref（V）：
            <InputNumber
              min={0}
              step={0.1}
              value={vref}
              onChange={(value) => setVref(value === null ? DEFAULT_PARAMS.vref : Number(value))}
              style={{ width: 110 }}
            />
          </span>
        </Space>

        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={polarity}
          options={POLARITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(event) => setPolarity(event.target.value as Polarity)}
        />
        <p className={styles.hint} style={{ marginTop: 8 }}>
          {POLARITY_OPTIONS.find((option) => option.value === polarity)?.hint}
        </p>

        {'error' in overview ? (
          <Alert type="warning" showIcon message="参数无效" description={overview.error} style={{ marginTop: 12 }} />
        ) : (
          <>
            <div className={styles.metricGrid} style={{ marginTop: 12 }}>
              {metricCards.map((metric) => (
                <div key={metric.label} className={styles.metric}>
                  <div className={styles.metricLabel}>{metric.label}</div>
                  <div className={styles.metricValue}>{metric.value}</div>
                </div>
              ))}
            </div>

            <Card size="small" style={{ marginTop: 16 }} title="电压 ↔ 码值互算">
              <Space wrap size="large" align="start">
                <div>
                  <div className={styles.hint} style={{ marginBottom: 6 }}>
                    电压 → 码值（输入电压 V）
                  </div>
                  <Space>
                    <InputNumber
                      value={voltage}
                      step={overview.data ? overview.data.lsb : 0.001}
                      onChange={(value) => setVoltage(value === null ? null : Number(value))}
                      style={{ width: 140 }}
                    />
                    <Radio.Group
                      size="small"
                      optionType="button"
                      value={rounding}
                      options={ROUNDING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                      onChange={(event) => setRounding(event.target.value as RoundingMode)}
                    />
                  </Space>
                  {voltageResult?.kind === 'error' ? (
                    <Alert type="warning" showIcon style={{ marginTop: 8 }} message={voltageResult.errorMessage} />
                  ) : null}
                </div>

                <div>
                  <div className={styles.hint} style={{ marginBottom: 6 }}>
                    码值 → 电压（输入十进制码值）
                  </div>
                  <input
                    className="ant-input"
                    style={{ width: 180 }}
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value)}
                    placeholder={`0..${overview.data?.maxCode ?? ''}`}
                  />
                  {codeResult?.kind === 'error' ? (
                    <Alert type="warning" showIcon style={{ marginTop: 8 }} message={codeResult.errorMessage} />
                  ) : null}
                </div>
              </Space>
              <Table
                style={{ marginTop: 12 }}
                size="small"
                pagination={false}
                columns={transferColumns}
                dataSource={transferRows}
              />
            </Card>

            <Card size="small" style={{ marginTop: 16 }} title="动态性能与 ENOB 反算">
              <Space wrap size="large">
                <span>
                  实测 SINAD（dB）：
                  <InputNumber
                    value={sinad}
                    step={0.1}
                    onChange={(value) => setSinad(value === null ? null : Number(value))}
                    style={{ width: 120 }}
                  />
                </span>
                {typeof enob === 'number' ? (
                  <Tag color="blue" className={styles.mono}>
                    ENOB = (SINAD − 1.76) / 6.02 = {sci(enob, 3)} 位
                  </Tag>
                ) : enob ? (
                  <Alert type="warning" showIcon message={enob} />
                ) : null}
              </Space>
              <p className={styles.hint} style={{ marginTop: 8 }}>
                理想 N 位转换器 SNR = 6.02N + 1.76 dB；量化噪声服从 ±½ LSB 均匀分布，RMS = LSB / √12。
              </p>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdcDacQuantizer;
