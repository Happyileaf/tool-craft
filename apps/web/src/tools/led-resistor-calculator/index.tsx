'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  DEFAULT_INPUT,
  LED_COLOR_PRESETS,
  TOPOLOGY_OPTIONS,
} from './constants';
import {
  calculateLedResistor,
  formatCurrentMa,
  formatPower,
  formatResistance,
  listE24Candidates,
  round,
  type LedTopology,
} from './utils/led';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 结果表格候选行 */
interface CandidateRow {
  key: number;
  value: number;
  label: string;
  deltaPercent: number;
  isCeiling: boolean;
}

/**
 * LED 限流电阻计算器：按 R = (Vs − Vf_total) / If 求理想电阻与功耗，
 * 在 E24 全系列中向上选型并回代实际电流，支持单路 / 串联 / 并联拓扑
 *
 * @returns LED 限流电阻计算器交互界面
 */
const LedResistorCalculator: React.FC<ToolComponentProps> = () => {
  const [supplyVoltage, setSupplyVoltage] = React.useState<number | null>(
    DEFAULT_INPUT.supplyVoltage,
  );
  const [forwardVoltage, setForwardVoltage] = React.useState<number | null>(
    DEFAULT_INPUT.forwardVoltage,
  );
  const [targetCurrentMa, setTargetCurrentMa] = React.useState<number | null>(
    DEFAULT_INPUT.targetCurrentMa,
  );
  const [topology, setTopology] = React.useState<LedTopology>(DEFAULT_INPUT.topology);
  const [count, setCount] = React.useState<number | null>(DEFAULT_INPUT.count);

  const result = React.useMemo(
    () =>
      calculateLedResistor({
        supplyVoltage,
        forwardVoltage,
        targetCurrentMa,
        topology,
        count,
      }),
    [supplyVoltage, forwardVoltage, targetCurrentMa, topology, count],
  );

  const candidates = React.useMemo<CandidateRow[]>(() => {
    if (result.idealResistance === null) return [];
    return listE24Candidates(result.idealResistance, 8).map((item, index) => ({
      key: index,
      value: item.value,
      label: formatResistance(item.value),
      deltaPercent: item.deltaPercent,
      isCeiling: item.isCeiling,
    }));
  }, [result.idealResistance]);

  const activeTopology = TOPOLOGY_OPTIONS.find((option) => option.value === topology);

  const handleCopy = () => {
    if (result.error || result.recommended === null) {
      message.error('暂无可复制的结果');
      return;
    }
    const lines = [
      `拓扑：${activeTopology?.label ?? topology}（N=${topology === 'single' ? 1 : count}）`,
      `LED 总压降 Vf_total：${result.vfTotal} V`,
      `理想电阻 R：${formatResistance(result.idealResistance ?? 0)}`,
      `单颗电阻功耗：${formatPower(result.idealPower ?? 0)}`,
      `推荐 E24 标称阻值：${formatResistance(result.recommended)}`,
      `实际电流：${formatCurrentMa(result.actualCurrentMa ?? 0)}（偏差 ${result.currentDeviationPercent}%）`,
      `电路总电流：${formatCurrentMa(result.totalCurrentMa ?? 0)}`,
      `电阻总功耗：${formatPower(result.totalPower ?? 0)}`,
    ];
    copyToClipboard(lines.join('\n'));
    message.success('已复制计算结果');
  };

  const handleReset = () => {
    setSupplyVoltage(DEFAULT_INPUT.supplyVoltage);
    setForwardVoltage(DEFAULT_INPUT.forwardVoltage);
    setTargetCurrentMa(DEFAULT_INPUT.targetCurrentMa);
    setTopology(DEFAULT_INPUT.topology);
    setCount(DEFAULT_INPUT.count);
  };

  const columns = [
    { title: 'E24 标称阻值', dataIndex: 'label', key: 'label' },
    {
      title: '相对理想值偏差',
      dataIndex: 'deltaPercent',
      key: 'deltaPercent',
      render: (value: number) => (
        <span className={styles.mono}>
          {value > 0 ? '+' : ''}
          {round(value, 2)}%
        </span>
      ),
    },
    {
      title: '选型',
      dataIndex: 'isCeiling',
      key: 'isCeiling',
      render: (isCeiling: boolean) =>
        isCeiling ? <Tag color="green">推荐（向上取值防过流）</Tag> : <span className={styles.hint}>—</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="LED 限流电阻计算器（R = (Vs − Vf) / If，E24 选型）"
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          输入电源电压、LED 正向压降与目标电流，实时计算限流电阻、功耗与 E24 标称选型；
          选型取不小于理想值的最接近标称阻值，保证实际电流不超标。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>电源电压 Vs（V）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.1}
              value={supplyVoltage}
              placeholder="如 5"
              onChange={(value) => setSupplyVoltage(value === null ? null : Number(value))}
            />
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>LED 正向压降 Vf（V，可手填覆盖预设）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.1}
              value={forwardVoltage}
              placeholder="如 2.0"
              onChange={(value) => setForwardVoltage(value === null ? null : Number(value))}
            />
            <Space size={4} wrap className={styles.presetRow}>
              {LED_COLOR_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  size="small"
                  type={forwardVoltage === preset.vf ? 'primary' : 'default'}
                  onClick={() => setForwardVoltage(preset.vf)}
                >
                  {preset.label} {preset.vf}V
                </Button>
              ))}
            </Space>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>目标电流 If（mA）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              value={targetCurrentMa}
              placeholder="如 20"
              onChange={(value) => setTargetCurrentMa(value === null ? null : Number(value))}
            />
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>连接拓扑与 LED 颗数 N</div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={topology}
              options={TOPOLOGY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setTopology(e.target.value as LedTopology)}
            />
            <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              min={1}
              step={1}
              precision={0}
              disabled={topology === 'single'}
              value={count}
              placeholder="LED 颗数 N"
              onChange={(value) => setCount(value === null ? null : Number(value))}
            />
            <div className={styles.hint}>{activeTopology?.hint}</div>
          </div>
        </div>

        <Space style={{ marginTop: 12 }}>
          <Button size="small" onClick={handleReset}>
            重置为默认（5V / 红 LED / 20mA）
          </Button>
        </Space>

        {result.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="无法计算"
            description={result.error}
          />
        ) : null}

        {result.warnings.map((warning) => (
          <Alert
            key={warning}
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={warning}
          />
        ))}

        {!result.error && result.recommended !== null ? (
          <div className={styles.resultBlock}>
            <Descriptions bordered size="small" column={2} title="计算结果">
              <Descriptions.Item label="LED 总压降 Vf_total">
                <span className={styles.mono}>{result.vfTotal} V</span>
              </Descriptions.Item>
              <Descriptions.Item label="理想电阻 R = (Vs − Vf_total) / If">
                <span className={styles.mono}>{formatResistance(result.idealResistance ?? 0)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="单颗电阻功耗 P = I²·R">
                <span className={styles.mono}>{formatPower(result.idealPower ?? 0)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="推荐 E24 标称阻值">
                <Tag color="blue" className={styles.monoTag}>
                  {formatResistance(result.recommended)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="选用标称值后的实际电流">
                <span className={styles.mono}>
                  {formatCurrentMa(result.actualCurrentMa ?? 0)}（偏差 {result.currentDeviationPercent}%）
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="电路总电流">
                <span className={styles.mono}>{formatCurrentMa(result.totalCurrentMa ?? 0)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="电阻总功耗" span={2}>
                <span className={styles.mono}>{formatPower(result.totalPower ?? 0)}</span>
              </Descriptions.Item>
            </Descriptions>

            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              columns={columns}
              dataSource={candidates}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default LedResistorCalculator;
