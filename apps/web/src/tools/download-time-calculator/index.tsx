'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Descriptions, InputNumber, Select, Slider, Table, Tag } from 'antd';
import {
  BANDWIDTH_PRESETS,
  BANDWIDTH_UNITS,
  SIZE_UNITS,
  buildComparisonTable,
  computeDownloadSeconds,
  formatClock,
  formatHuman,
} from './utils/download';
import { DEFAULT_BANDWIDTH, DEFAULT_EFFICIENCY, DEFAULT_SIZE } from './constants';
import styles from './index.module.css';

/** 秒速显示：不足 1 秒保留 3 位小数，否则取整并加分隔符 */
function formatSeconds(value: number): string {
  if (value < 1) return value.toFixed(3);
  return Math.round(value).toLocaleString('en-US');
}

/** 单个输入字段的表单状态：数值（null 表示未填写）+ 当前单位 */
interface FieldState {
  value: number | null;
  unit: string;
}

const DownloadTimeCalculator: React.FC<ToolComponentProps> = () => {
  const [size, setSize] = React.useState<FieldState>(DEFAULT_SIZE);
  const [bandwidth, setBandwidth] = React.useState<FieldState>(DEFAULT_BANDWIDTH);
  const [efficiency, setEfficiency] = React.useState(DEFAULT_EFFICIENCY);

  const outcome = React.useMemo<{
    seconds?: number;
    sizeBytes?: number;
    bandwidthBps?: number;
    error?: string;
  }>(() => {
    try {
      if (size.value === null || bandwidth.value === null) return {};
      const sizeFactor = SIZE_UNITS.find((item) => item.label === size.unit)?.factor ?? 1;
      const bandwidthFactor =
        BANDWIDTH_UNITS.find((item) => item.label === bandwidth.unit)?.factor ?? 1;
      const sizeBytes = Number(size.value) * sizeFactor;
      const bandwidthBps = Number(bandwidth.value) * bandwidthFactor;
      const seconds = computeDownloadSeconds(sizeBytes, bandwidthBps, efficiency);
      return { seconds, sizeBytes, bandwidthBps };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [size, bandwidth, efficiency]);

  const comparison = React.useMemo(
    () =>
      typeof outcome.seconds === 'number'
        ? buildComparisonTable(outcome.sizeBytes ?? 0, efficiency)
        : [],
    [outcome, efficiency],
  );

  const columns = [
    { title: '网络档位', dataIndex: 'label', key: 'label' },
    {
      title: '耗时（时钟）',
      dataIndex: 'clock',
      key: 'clock',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '人类可读',
      dataIndex: 'human',
      key: 'human',
    },
    {
      title: '秒',
      dataIndex: 'seconds',
      key: 'seconds',
      render: (value: number) => <span className={styles.mono}>{formatSeconds(value)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="文件下载时间估算器">
        <p className={styles.hint}>
          按网络口径十进制换算：1 KB = 1000 B、1 Mbps = 10⁶ bit/s，1 byte = 8 bit。
          调整文件大小、带宽与效率系数，主结果与多档位对照表实时更新。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>文件大小</div>
            <div className={styles.inputRow}>
              <InputNumber
                style={{ flex: 1 }}
                min={0}
                value={size.value}
                onChange={(value) =>
                  setSize((previous) => ({ ...previous, value: value === null ? null : Number(value) }))
                }
              />
              <Select
                style={{ width: 88 }}
                value={size.unit}
                onChange={(unit) => setSize((previous) => ({ ...previous, unit }))}
                options={SIZE_UNITS.map((item) => ({ label: item.label, value: item.label }))}
              />
            </div>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>实际可用带宽</div>
            <div className={styles.inputRow}>
              <InputNumber
                style={{ flex: 1 }}
                min={0}
                value={bandwidth.value}
                onChange={(value) =>
                  setBandwidth((previous) => ({
                    ...previous,
                    value: value === null ? null : Number(value),
                  }))
                }
              />
              <Select
                style={{ width: 96 }}
                value={bandwidth.unit}
                onChange={(unit) => setBandwidth((previous) => ({ ...previous, unit }))}
                options={BANDWIDTH_UNITS.map((item) => ({ label: item.label, value: item.label }))}
              />
            </div>
            <div className={styles.presetRow}>
              {BANDWIDTH_PRESETS.map((preset) => (
                <Tag
                  key={preset.label}
                  className={styles.presetTag}
                  color="blue"
                  onClick={() => setBandwidth({ value: preset.value, unit: preset.unit })}
                >
                  {preset.label}
                </Tag>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.efficiencyBox}>
          <div className={styles.fieldLabel}>
            传输效率系数（协议开销 / 拥塞折减）：<strong>{Math.round(efficiency * 100)}%</strong>
          </div>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={efficiency}
            onChange={(value) => setEfficiency(value)}
            marks={{ 0.5: '50%', 0.8: '80%', 1: '100%' }}
          />
        </div>

        {outcome.error ? (
          <Alert type="warning" showIcon message="无法估算" description={outcome.error} />
        ) : null}

        {typeof outcome.seconds === 'number' ? (
          <>
            <Descriptions
              className={styles.resultBox}
              size="small"
              bordered
              column={1}
              title="估算结果"
            >
              <Descriptions.Item label="理论耗时（时钟格式）">
                <span className={styles.emphasis}>{formatClock(outcome.seconds)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="人类可读">
                <span className={styles.mono}>{formatHuman(outcome.seconds)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="折合秒数">
                <span className={styles.mono}>{formatSeconds(outcome.seconds)} s</span>
              </Descriptions.Item>
            </Descriptions>

            <Table
              className={styles.tableBox}
              size="small"
              pagination={false}
              columns={columns}
              dataSource={comparison}
              rowKey="label"
              title={() => '常见网络档位对照表（按当前效率系数折减）'}
            />
          </>
        ) : null}
      </Card>
    </div>
  );
};

export default DownloadTimeCalculator;
