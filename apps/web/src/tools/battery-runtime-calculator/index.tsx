'use client';

import {
  Alert,
  Card,
  Checkbox,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  CAPACITY_UNITS,
  DEFAULT_CAPACITY,
  DEFAULT_CELL_CAPACITY,
  DEFAULT_CELL_VOLTAGE,
  DEFAULT_DOD,
  DEFAULT_EFFICIENCY,
  DEFAULT_LOAD_VALUE,
  DEFAULT_PARALLEL,
  DEFAULT_SERIES,
  DEFAULT_VOLTAGE,
  EFFICIENCY_PRESETS,
} from './constants';
import {
  calculateRuntime,
  capacityAh,
  capacityWh,
  formatRuntime,
  packSpec,
  runtimeTable,
} from './utils/battery';
import type { BatterySpec, RuntimeOptions } from './utils/battery';
import styles from './index.module.css';

type PackMode = 'single' | 'pack';
type Result =
  | { ok: true; runtimeHours: number; runtimeMinutes: number; usableWh: number; usableAh: number; loadCurrentA: number; loadPowerW: number; peukertApplied: boolean }
  | { ok: false; error: string };

interface TableRow {
  ratio: number;
  currentA: number;
  runtimeLabel: string;
}

export default function BatteryRuntimeCalculatorTool({ defaultInput }: ToolComponentProps) {
  const [packMode, setPackMode] = useState<PackMode>('single');
  const [capacity, setCapacity] = useState<number | null>(DEFAULT_CAPACITY);
  const [unit, setUnit] = useState<BatterySpec['unit']>('Ah');
  const [voltage, setVoltage] = useState<number | null>(DEFAULT_VOLTAGE);

  const [cellCapacity, setCellCapacity] = useState<number | null>(DEFAULT_CELL_CAPACITY);
  const [cellVoltage, setCellVoltage] = useState<number | null>(DEFAULT_CELL_VOLTAGE);
  const [series, setSeries] = useState<number | null>(DEFAULT_SERIES);
  const [parallel, setParallel] = useState<number | null>(DEFAULT_PARALLEL);

  const [loadType, setLoadType] = useState<'current' | 'power'>(
    defaultInput === 'power' ? 'power' : 'current',
  );
  const [loadValue, setLoadValue] = useState<number | null>(DEFAULT_LOAD_VALUE);
  const [efficiency, setEfficiency] = useState<number | null>(DEFAULT_EFFICIENCY);
  const [dod, setDod] = useState<number | null>(DEFAULT_DOD);
  const [peukertEnabled, setPeukertEnabled] = useState(false);
  const [peukertExponent, setPeukertExponent] = useState<number | null>(1.2);
  const [ratedCurrent, setRatedCurrent] = useState<number | null>(null);

  const spec = useMemo<BatterySpec | null>(() => {
    if (packMode === 'pack') {
      if (
        cellCapacity === null ||
        cellVoltage === null ||
        series === null ||
        parallel === null
      ) {
        return null;
      }
      try {
        return packSpec({
          cellCapacityMah: cellCapacity,
          cellVoltage,
          series,
          parallel,
        });
      } catch {
        return null;
      }
    }
    if (capacity === null || voltage === null) {
      return null;
    }
    return { capacity, unit, voltage };
  }, [capacity, cellCapacity, cellVoltage, packMode, parallel, series, unit, voltage]);

  const options = useMemo<RuntimeOptions | null>(() => {
    if (loadValue === null || efficiency === null || dod === null) {
      return null;
    }
    return {
      loadType,
      currentA: loadType === 'current' ? loadValue : undefined,
      powerW: loadType === 'power' ? loadValue : undefined,
      efficiencyPct: efficiency,
      depthOfDischargePct: dod,
      peukertExponent: peukertEnabled ? peukertExponent ?? 1.2 : 1,
      ratedCurrentA: peukertEnabled ? ratedCurrent ?? undefined : undefined,
    };
  }, [dod, efficiency, loadType, loadValue, peukertEnabled, peukertExponent, ratedCurrent]);

  const result = useMemo<Result>(() => {
    if (!spec || !options) {
      return { ok: false, error: '请填写完整的电池与负载参数' };
    }
    try {
      const data = calculateRuntime(spec, options);
      return {
        ok: true,
        runtimeHours: data.runtimeHours,
        runtimeMinutes: data.runtimeMinutes,
        usableWh: data.usableWh,
        usableAh: data.usableAh,
        loadCurrentA: data.loadCurrentA,
        loadPowerW: data.loadPowerW,
        peukertApplied: data.peukertApplied,
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '计算失败' };
    }
  }, [options, spec]);

  const table = useMemo<TableRow[]>(() => {
    if (!spec || !options) {
      return [];
    }
    try {
      return runtimeTable(spec, options).map((row) => ({
        ratio: row.ratio,
        currentA: row.currentA,
        runtimeLabel: row.runtimeLabel,
      }));
    } catch {
      return [];
    }
  }, [options, spec]);

  const nominal = useMemo(() => {
    if (!spec) {
      return null;
    }
    try {
      const ah = capacityAh(spec);
      return { ah, wh: capacityWh(spec) };
    } catch {
      return null;
    }
  }, [spec]);

  return (
    <div className={styles.container}>
      <Card title="电池参数">
        <Radio.Group
          value={packMode}
          onChange={(event) => setPackMode(event.target.value)}
          options={[
            { label: '单体电池', value: 'single' },
            { label: '串并联电池组', value: 'pack' },
          ]}
          className={styles.modeGroup}
        />

        {packMode === 'single' ? (
          <div className={styles.inputs}>
            <label className={styles.field}>
              <span className={styles.label}>标称容量</span>
              <Space.Compact>
                <InputNumber
                  min={0}
                  step={100}
                  value={capacity}
                  onChange={setCapacity}
                  className={styles.capacityInput}
                />
                <Select
                  value={unit}
                  onChange={setUnit}
                  options={CAPACITY_UNITS.map((item) => ({ label: item.label, value: item.value }))}
                  className={styles.unitSelect}
                />
              </Space.Compact>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>标称电压（V）</span>
              <InputNumber min={0.1} step={0.1} value={voltage} onChange={setVoltage} className={styles.control} />
            </label>
          </div>
        ) : (
          <div className={styles.inputs}>
            <label className={styles.field}>
              <span className={styles.label}>单节容量（mAh）</span>
              <InputNumber min={0} step={100} value={cellCapacity} onChange={setCellCapacity} className={styles.control} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>单节电压（V）</span>
              <InputNumber min={0.1} step={0.1} value={cellVoltage} onChange={setCellVoltage} className={styles.control} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>串联节数</span>
              <InputNumber min={1} step={1} precision={0} value={series} onChange={setSeries} className={styles.control} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>并联组数</span>
              <InputNumber min={1} step={1} precision={0} value={parallel} onChange={setParallel} className={styles.control} />
            </label>
          </div>
        )}

        {nominal ? (
          <Space wrap>
            <Tag color="blue">等效 {nominal.ah.toFixed(2)} Ah</Tag>
            <Tag>{nominal.wh.toFixed(2)} Wh</Tag>
            {spec ? <Tag>{spec.voltage.toFixed(2)} V</Tag> : null}
          </Space>
        ) : null}
      </Card>

      <Card title="负载与放电条件">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>负载类型</span>
            <Select
              value={loadType}
              onChange={setLoadType}
              options={[
                { label: '负载电流（A）', value: 'current' },
                { label: '负载功率（W）', value: 'power' },
              ]}
              className={styles.control}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{loadType === 'current' ? '负载电流（A）' : '负载功率（W）'}</span>
            <InputNumber min={0} step={0.1} value={loadValue} onChange={setLoadValue} className={styles.control} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>转换效率（%）</span>
            <InputNumber min={1} max={100} step={1} value={efficiency} onChange={setEfficiency} className={styles.control} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>放电深度（%）</span>
            <InputNumber min={1} max={100} step={1} value={dod} onChange={setDod} className={styles.control} />
          </label>
        </div>

        <Space wrap className={styles.presets}>
          {EFFICIENCY_PRESETS.map((value) => (
            <Tag key={value} color="blue" className={styles.preset} onClick={() => setEfficiency(value)}>
              效率 {value}%
            </Tag>
          ))}
        </Space>

        <Checkbox checked={peukertEnabled} onChange={(event) => setPeukertEnabled(event.target.checked)}>
          启用 Peukert 修正（高倍率放电容量衰减）
        </Checkbox>

        {peukertEnabled ? (
          <div className={styles.inputs}>
            <label className={styles.field}>
              <span className={styles.label}>Peukert 指数 k</span>
              <InputNumber min={1} step={0.05} value={peukertExponent} onChange={setPeukertExponent} className={styles.control} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>基准电流（A，留空按 1C）</span>
              <InputNumber min={0.1} step={0.1} value={ratedCurrent} onChange={setRatedCurrent} className={styles.control} />
            </label>
          </div>
        ) : null}
      </Card>

      <Card title="续航结果">
        {result.ok ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>预计续航</span>
                <span className={styles.value}>{formatRuntime(result.runtimeHours)}</span>
                <span className={styles.sub}>{result.runtimeHours.toFixed(2)} 小时 / {result.runtimeMinutes.toFixed(0)} 分钟</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>可用能量</span>
                <span className={styles.value}>{result.usableWh.toFixed(1)} Wh</span>
                <span className={styles.sub}>可用容量 {result.usableAh.toFixed(2)} Ah</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>负载电流</span>
                <span className={styles.value}>{result.loadCurrentA.toFixed(2)} A</span>
                <span className={styles.sub}>负载功率 {result.loadPowerW.toFixed(1)} W</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Peukert 修正</span>
                <span className={styles.value}>{result.peukertApplied ? '已启用' : '未启用'}</span>
                <span className={styles.sub}>k = {peukertEnabled ? peukertExponent ?? 1.2 : 1}</span>
              </div>
            </div>
          </>
        ) : (
          <Alert type="warning" showIcon message={result.error} />
        )}

        <Table<TableRow>
          size="small"
          rowKey="ratio"
          pagination={false}
          dataSource={table}
          locale={{ emptyText: '请先填写有效参数' }}
          columns={[
            { title: '放电倍率', dataIndex: 'ratio', render: (value: number) => `${value}C` },
            { title: '电流（A）', dataIndex: 'currentA', render: (value: number) => value.toFixed(2) },
            { title: '预计续航', dataIndex: 'runtimeLabel' },
          ]}
        />
      </Card>
    </div>
  );
}
