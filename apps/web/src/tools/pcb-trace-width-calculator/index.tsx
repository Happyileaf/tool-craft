'use client';

import React from 'react';
import { Alert, Card, InputNumber, Radio, Select, Table } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  calculateMaxCurrent,
  calculateTraceWidth,
  type LayerType,
} from './utils/ipc2221';
import {
  COPPER_PRESETS,
  DEFAULT_COPPER_OUNCE,
  DEFAULT_CURRENT,
  DEFAULT_TEMP_RISE,
  DEFAULT_WIDTH_MIL,
} from './constants';
import styles from './index.module.css';

interface LayerRow {
  key: LayerType;
  layer: string;
  widthMil: number;
  widthMm: number;
}

const format = (value: number, digits: number): string => value.toFixed(digits);

/**
 * 基于 IPC-2221 的 PCB 导线宽度计算器，正向求最小线宽、反向估算载流能力
 */
const PcbTraceWidthCalculator: React.FC<ToolComponentProps> = () => {
  const [current, setCurrent] = React.useState(DEFAULT_CURRENT);
  const [tempRise, setTempRise] = React.useState(DEFAULT_TEMP_RISE);
  const [copperOunce, setCopperOunce] = React.useState(DEFAULT_COPPER_OUNCE);
  const [layer, setLayer] = React.useState<LayerType>('external');

  const [reverseWidth, setReverseWidth] = React.useState(DEFAULT_WIDTH_MIL);
  const [reverseTempRise, setReverseTempRise] = React.useState(DEFAULT_TEMP_RISE);
  const [reverseCopper, setReverseCopper] = React.useState(DEFAULT_COPPER_OUNCE);
  const [reverseLayer, setReverseLayer] = React.useState<LayerType>('external');

  const forward = React.useMemo(() => {
    try {
      return {
        result: calculateTraceWidth({ current, tempRise, copperOunce, layer }),
        error: null as string | null,
      };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [current, tempRise, copperOunce, layer]);

  const comparison = React.useMemo<LayerRow[]>(() => {
    const layers: Array<{ key: LayerType; layer: string }> = [
      { key: 'external', layer: '外层（External）' },
      { key: 'internal', layer: '内层（Internal）' },
    ];
    return layers.map((entry) => {
      const result = calculateTraceWidth({
        current,
        tempRise,
        copperOunce,
        layer: entry.key,
      });
      return {
        key: entry.key,
        layer: entry.layer,
        widthMil: result.widthMil,
        widthMm: result.widthMm,
      };
    });
  }, [current, tempRise, copperOunce]);

  const reverse = React.useMemo(() => {
    try {
      return {
        current: calculateMaxCurrent({
          widthMil: reverseWidth,
          tempRise: reverseTempRise,
          copperOunce: reverseCopper,
          layer: reverseLayer,
        }),
        error: null as string | null,
      };
    } catch (caught) {
      return { current: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [reverseWidth, reverseTempRise, reverseCopper, reverseLayer]);

  return (
    <div className={styles.container}>
      <Card title="正向计算：由电流求最小导线宽度">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>负载电流（A）</span>
            <InputNumber
              min={0.001}
              max={1000}
              step={0.1}
              value={current}
              onChange={(value) => setCurrent(value ?? DEFAULT_CURRENT)}
              style={{ width: 140 }}
            />
          </div>
          <div>
            <span className={styles.label}>允许温升 ΔT（°C）</span>
            <InputNumber
              min={1}
              max={100}
              value={tempRise}
              onChange={(value) => setTempRise(value ?? DEFAULT_TEMP_RISE)}
              style={{ width: 140 }}
            />
          </div>
          <div>
            <span className={styles.label}>铜厚</span>
            <Select
              value={copperOunce}
              onChange={(value) => setCopperOunce(value)}
              style={{ width: 200 }}
              options={COPPER_PRESETS}
            />
          </div>
          <div>
            <span className={styles.label}>铜层位置</span>
            <Radio.Group value={layer} onChange={(event) => setLayer(event.target.value as LayerType)}>
              <Radio.Button value="external">外层</Radio.Button>
              <Radio.Button value="internal">内层</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {forward.error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="计算失败"
            description={forward.error}
          />
        ) : (
          forward.result && (
            <div className={styles.resultCard}>
              <div className={styles.metricGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>最小线宽（mil）</span>
                  <span className={styles.metricValue}>{format(forward.result.widthMil, 2)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>最小线宽（mm）</span>
                  <span className={styles.metricValue}>{format(forward.result.widthMm, 3)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>载流截面积（mil²）</span>
                  <span className={styles.metricValue}>{format(forward.result.areaMil2, 2)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>铜厚（mil）</span>
                  <span className={styles.metricValue}>{format(forward.result.thicknessMil, 3)}</span>
                </div>
              </div>

              <div>
                <span className={styles.label}>外层与内层对比（相同电流、温升与铜厚）</span>
                <Table<LayerRow>
                  size="small"
                  rowKey="key"
                  pagination={false}
                  dataSource={comparison}
                  columns={[
                    { title: '铜层', dataIndex: 'layer' },
                    {
                      title: '最小线宽（mil）',
                      dataIndex: 'widthMil',
                      render: (value: number) => format(value, 2),
                    },
                    {
                      title: '最小线宽（mm）',
                      dataIndex: 'widthMm',
                      render: (value: number) => format(value, 3),
                    },
                  ]}
                />
              </div>
            </div>
          )
        )}
      </Card>

      <Card title="反向估算：由线宽推算载流能力">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>导线宽度（mil）</span>
            <InputNumber
              min={0.1}
              max={1000}
              step={1}
              value={reverseWidth}
              onChange={(value) => setReverseWidth(value ?? DEFAULT_WIDTH_MIL)}
              style={{ width: 140 }}
            />
          </div>
          <div>
            <span className={styles.label}>允许温升 ΔT（°C）</span>
            <InputNumber
              min={1}
              max={100}
              value={reverseTempRise}
              onChange={(value) => setReverseTempRise(value ?? DEFAULT_TEMP_RISE)}
              style={{ width: 140 }}
            />
          </div>
          <div>
            <span className={styles.label}>铜厚</span>
            <Select
              value={reverseCopper}
              onChange={(value) => setReverseCopper(value)}
              style={{ width: 200 }}
              options={COPPER_PRESETS}
            />
          </div>
          <div>
            <span className={styles.label}>铜层位置</span>
            <Radio.Group
              value={reverseLayer}
              onChange={(event) => setReverseLayer(event.target.value as LayerType)}
            >
              <Radio.Button value="external">外层</Radio.Button>
              <Radio.Button value="internal">内层</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {reverse.error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="计算失败"
            description={reverse.error}
          />
        ) : (
          reverse.current !== null && (
            <div className={styles.resultCard}>
              <div className={styles.metricGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>可持续承载电流（A）</span>
                  <span className={styles.metricValue}>{format(reverse.current, 2)}</span>
                </div>
              </div>
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="IPC-2221 计算说明"
        description={
          <div className={styles.hint}>
            <p>
              本工具采用 IPC-2221 经典载流公式：截面积 A[mil²] = (I / (k · ΔT<sup>0.44</sup>))
              <sup>1 / 0.725</sup>，线宽 W = A / 铜厚。外层允许更大散热，取 k = 0.048；内层散热较差，
              取 k = 0.024；1 oz 铜厚约为 1.378 mil（35 µm）。
            </p>
            <p>
              计算结果为满足指定温升的最小线宽理论值，实际设计还应结合敷铜、过孔、走线长度、环境温度、
              安全裕量与制造工艺能力留出余量。IPC-2221 图表法本身偏保守，关键电源路径建议以仿真或实测温升复核。
            </p>
            <p>所有计算均在本地浏览器完成，不涉及任何网络请求。</p>
          </div>
        }
      />
    </div>
  );
};

export default PcbTraceWidthCalculator;
