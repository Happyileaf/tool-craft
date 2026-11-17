'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  LENGTH_UNITS,
  calculateRoomGeometry,
  averageIlluminance,
  requiredLuminaireCount,
  requiredLumenPerLuminaire,
  interpolateUtilizationFactor,
  type UnitOption,
  type CuTablePoint,
  type RoomGeometry,
} from './utils/lumen-method';
import {
  CALC_MODE_OPTIONS,
  MAINTENANCE_HINTS,
  DEFAULT_CU_TABLE,
  HIGH_RCR_WARN,
  ILLUMINANCE_REFERENCE,
  type CalcMode,
  type CuInputMode,
} from './constants';
import styles from './index.module.css';

type NullableNumber = number | null;

interface FormState {
  mode: CalcMode;
  cuMode: CuInputMode;
  length: { value: NullableNumber; unit: string };
  width: { value: NullableNumber; unit: string };
  mountingHeight: { value: NullableNumber; unit: string };
  workingHeight: { value: NullableNumber; unit: string };
  lumens: NullableNumber;
  count: NullableNumber;
  cuDirect: NullableNumber;
  mf: NullableNumber;
  targetLux: NullableNumber;
  cuTable: CuTablePoint[];
}

/** 计算结果（三种模式互斥字段） */
interface OutcomeResult {
  /** 正算平均照度 */
  eavg?: number;
  /** 反算灯具数结果 */
  reverse?: ReturnType<typeof requiredLuminaireCount>;
  /** 反算所需单灯光通量 */
  requiredPhi?: number;
}

/** 计算输出统一形状（错误与结果互斥） */
interface Outcome {
  geometry?: RoomGeometry;
  cu?: number;
  result?: OutcomeResult;
  warnings?: string[];
  error?: string;
}

function initialState(): FormState {
  return {
    mode: 'forward',
    cuMode: 'direct',
    length: { value: 10, unit: 'm' },
    width: { value: 8, unit: 'm' },
    mountingHeight: { value: 3.25, unit: 'm' },
    workingHeight: { value: 0.75, unit: 'm' },
    lumens: 3000,
    count: 12,
    cuDirect: 0.55,
    mf: 0.8,
    targetLux: 300,
    cuTable: DEFAULT_CU_TABLE.map((point) => ({ ...point })),
  };
}

function factorOf(options: UnitOption[], label: string): number {
  return options.find((item) => item.label === label)?.factor ?? 1;
}

function formatNumber(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e7)) return value.toExponential(digits - 1);
  return String(parseFloat(value.toPrecision(8)));
}

/** 带单位下拉的长度输入 */
const LengthInput: React.FC<{
  label: string;
  field: { value: NullableNumber; unit: string };
  onChange: (field: { value: NullableNumber; unit: string }) => void;
}> = ({ label, field, onChange }) => (
  <div className={styles.fieldCard}>
    <div className={styles.fieldLabel}>{label}</div>
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        style={{ flex: 1 }}
        value={field.value}
        onChange={(value) => onChange({ ...field, value: value === null ? null : Number(value) })}
      />
      <Select
        style={{ width: 80 }}
        value={field.unit}
        onChange={(unit) => onChange({ ...field, unit })}
        options={LENGTH_UNITS.map((u) => ({ label: u.label, value: u.label }))}
      />
    </Space.Compact>
  </div>
);

/**
 * 室内平均照度计算器（利用系数法 / 流明法）
 *
 * @returns 照度计算交互界面
 */
const AverageIlluminanceCalculator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<FormState>(initialState);
  const patch = (key: keyof FormState, value: unknown) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const outcome = React.useMemo<Outcome>(() => {
    try {
      const length = (form.length.value ?? NaN) * factorOf(LENGTH_UNITS, form.length.unit);
      const width = (form.width.value ?? NaN) * factorOf(LENGTH_UNITS, form.width.unit);
      const mounting =
        (form.mountingHeight.value ?? NaN) * factorOf(LENGTH_UNITS, form.mountingHeight.unit);
      const working =
        (form.workingHeight.value ?? NaN) * factorOf(LENGTH_UNITS, form.workingHeight.unit);

      const geometry = calculateRoomGeometry(length, width, mounting, working);

      // CU：直输或按 RCR 插值
      let cu: number;
      if (form.cuMode === 'direct') {
        cu = form.cuDirect ?? NaN;
        if (!(cu > 0) || cu > 1) {
          return { geometry, error: '利用系数 CU 必须落在 (0, 1] 区间。' };
        }
      } else {
        cu = interpolateUtilizationFactor(geometry.rcr, form.cuTable);
      }

      const mf = form.mf ?? NaN;
      if (!(mf > 0) || mf > 1) {
        return { geometry, cu, error: '维护系数 MF 必须落在 (0, 1] 区间。' };
      }

      const warnings: string[] = [];
      if (geometry.rcr > HIGH_RCR_WARN) {
        warnings.push(
          `室空间比 RCR=${formatNumber(geometry.rcr)} 偏大（>${HIGH_RCR_WARN}），室形深窄，利用系数通常偏低，建议优化灯具布置或选用宽配光灯具。`,
        );
      }

      if (form.mode === 'forward') {
        const n = form.count ?? NaN;
        const phi = form.lumens ?? NaN;
        if (!Number.isInteger(n) || n <= 0) return { geometry, cu, error: '灯具数量 N 必须为正整数。' };
        if (!(phi > 0)) return { geometry, cu, error: '单灯光通量 Φ 必须大于 0。' };
        const eavg = averageIlluminance(n, phi, cu, mf, geometry.area);
        return { geometry, cu, result: { eavg }, warnings };
      }

      const target = form.targetLux ?? NaN;
      if (!(target > 0)) return { geometry, cu, error: '目标照度必须大于 0。' };

      if (form.mode === 'reverse-count') {
        const phi = form.lumens ?? NaN;
        if (!(phi > 0)) return { geometry, cu, error: '单灯光通量 Φ 必须大于 0。' };
        const reverse = requiredLuminaireCount(target, phi, cu, mf, geometry.area);
        return { geometry, cu, result: { reverse }, warnings };
      }

      const n = form.count ?? NaN;
      if (!Number.isInteger(n) || n <= 0) return { geometry, cu, error: '灯具数量 N 必须为正整数。' };
      const requiredPhi = requiredLumenPerLuminaire(target, n, cu, mf, geometry.area);
      return { geometry, cu, result: { requiredPhi }, warnings };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [form]);

  const reset = () => setForm(initialState());

  const copyResult = () => {
    if (!outcome.result) {
      message.warning('暂无可复制的结果');
      return;
    }
    const g = outcome.geometry;
    const lines = [
      `面积 A=${formatNumber(g?.area)} m²，hrc=${formatNumber(g?.hrc)} m，RCR=${formatNumber(g?.rcr)}，RI=${formatNumber(g?.ri)}`,
      `CU=${formatNumber(outcome.cu)}，MF=${String(form.mf)}`,
    ];
    if (outcome.result.eavg !== undefined)
      lines.push(`平均维持照度 Eavg=${formatNumber(outcome.result.eavg)} lux`);
    if (outcome.result.reverse)
      lines.push(
        `所需灯具 N=${outcome.result.reverse.count} 盏，复核照度=${formatNumber(outcome.result.reverse.achievedIlluminance)} lux`,
      );
    if (outcome.result.requiredPhi !== undefined)
      lines.push(`所需单灯光通量 Φ=${formatNumber(outcome.result.requiredPhi)} lm`);
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const updateTableRow = (index: number, field: keyof CuTablePoint, value: number | null) => {
    if (value === null) return;
    const nextTable = form.cuTable.map((point, i) =>
      i === index ? { ...point, [field]: Number(value) } : point,
    );
    patch('cuTable', nextTable);
  };

  return (
    <div className={styles.container}>
      <Card
        title="室内平均照度计算器（利用系数法 / 流明法）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          按流明法 Eavg = N·Φ·CU·MF / A 计算工作面平均维持照度，自动求室空间比 RCR 与室形指数
          RI，支持正算照度与反算灯具数、光通量。CU 可直输或按 RCR 对照表线性插值。全部本地计算。
        </p>

        <h4 className={styles.sectionTitle}>房间几何参数</h4>
        <div className={styles.fieldGrid}>
          <LengthInput label="房间长度 L" field={form.length} onChange={(field) => patch('length', field)} />
          <LengthInput label="房间宽度 W" field={form.width} onChange={(field) => patch('width', field)} />
          <LengthInput
            label="灯具安装高度"
            field={form.mountingHeight}
            onChange={(field) => patch('mountingHeight', field)}
          />
          <LengthInput
            label="工作面高度"
            field={form.workingHeight}
            onChange={(field) => patch('workingHeight', field)}
          />
        </div>

        <h4 className={styles.sectionTitle}>计算模式与灯具参数</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>计算模式</div>
            <Radio.Group
              value={form.mode}
              onChange={(event) => patch('mode', event.target.value as CalcMode)}
            >
              <Space direction="vertical">
                {CALC_MODE_OPTIONS.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            <p className={styles.microHint}>
              {CALC_MODE_OPTIONS.find((option) => option.value === form.mode)?.hint}
            </p>
          </div>

          {form.mode !== 'reverse-lumen' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>单灯光通量 Φ（lm）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={form.lumens}
                onChange={(value) => patch('lumens', value === null ? null : Number(value))}
              />
            </div>
          ) : null}

          {form.mode !== 'reverse-count' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>灯具数量 N（正整数）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                precision={0}
                value={form.count}
                onChange={(value) => patch('count', value === null ? null : Number(value))}
              />
            </div>
          ) : null}

          {form.mode !== 'forward' ? (
            <div className={styles.fieldCard}>
              <div className={styles.fieldLabel}>目标平均照度（lux）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={form.targetLux}
                onChange={(value) => patch('targetLux', value === null ? null : Number(value))}
              />
            </div>
          ) : null}

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>维护系数 MF</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.05}
              value={form.mf}
              onChange={(value) => patch('mf', value === null ? null : Number(value))}
            />
            <p className={styles.microHint}>
              {MAINTENANCE_HINTS.map((hint) => `${hint.scene}：${hint.range}`).join('；')}
            </p>
          </div>
        </div>

        <h4 className={styles.sectionTitle}>利用系数 CU</h4>
        <Radio.Group
          value={form.cuMode}
          onChange={(event) => patch('cuMode', event.target.value as CuInputMode)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="direct">直接输入 CU</Radio.Button>
          <Radio.Button value="table">按 RCR 对照表插值</Radio.Button>
        </Radio.Group>

        {form.cuMode === 'direct' ? (
          <div className={styles.fieldCard} style={{ marginTop: 12, maxWidth: 320 }}>
            <div className={styles.fieldLabel}>利用系数 CU（0, 1]</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.01}
              value={form.cuDirect}
              onChange={(value) => patch('cuDirect', value === null ? null : Number(value))}
            />
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={form.cuTable.map((point, index) => ({ ...point, key: index }))}
              columns={[
                {
                  title: 'RCR',
                  dataIndex: 'rcr',
                  key: 'rcr',
                  width: 160,
                  render: (_: unknown, record: CuTablePoint & { key: number }) => (
                    <InputNumber
                      size="small"
                      style={{ width: 120 }}
                      min={0}
                      step={0.5}
                      value={record.rcr}
                      onChange={(value) => updateTableRow(record.key, 'rcr', value)}
                    />
                  ),
                },
                {
                  title: 'CU',
                  dataIndex: 'cu',
                  key: 'cu',
                  width: 160,
                  render: (_: unknown, record: CuTablePoint & { key: number }) => (
                    <InputNumber
                      size="small"
                      style={{ width: 120 }}
                      min={0}
                      max={1}
                      step={0.01}
                      value={record.cu}
                      onChange={(value) => updateTableRow(record.key, 'cu', value)}
                    />
                  ),
                },
              ]}
            />
            <p className={styles.microHint}>
              表须按 RCR 升序；示例数据仅用于演示，实际工程请替换为所选灯具厂商光度数据表。
            </p>
          </div>
        )}

        <Space wrap style={{ marginTop: 16 }}>
          <Button size="small" onClick={reset}>
            重置为示例
          </Button>
        </Space>

        {outcome.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="无法计算"
            description={outcome.error}
          />
        ) : null}

        {outcome.geometry ? (
          <Descriptions style={{ marginTop: 16 }} size="small" bordered column={2}>
            <Descriptions.Item label="房间面积 A">
              <span className={styles.mono}>{formatNumber(outcome.geometry.area)} m²</span>
            </Descriptions.Item>
            <Descriptions.Item label="计算高度 hrc">
              <span className={styles.mono}>{formatNumber(outcome.geometry.hrc)} m</span>
            </Descriptions.Item>
            <Descriptions.Item label="室空间比 RCR">
              <span className={styles.mono}>{formatNumber(outcome.geometry.rcr)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="室形指数 RI（=5/RCR）">
              <span className={styles.mono}>{formatNumber(outcome.geometry.ri)}</span>
            </Descriptions.Item>
          </Descriptions>
        ) : null}

        {outcome.result ? (
          <div style={{ marginTop: 12 }}>
            {outcome.result.eavg !== undefined ? (
              <Tag color="blue" style={{ fontSize: 16, padding: '6px 16px' }}>
                平均维持照度 Eavg ≈ {formatNumber(outcome.result.eavg)} lux
              </Tag>
            ) : null}
            {outcome.result.reverse ? (
              <div>
                <Tag color="green" style={{ fontSize: 16, padding: '6px 16px' }}>
                  所需灯具 N = {outcome.result.reverse.count} 盏（理论值{' '}
                  {formatNumber(outcome.result.reverse.rawCount, 2)}，向上取整）
                </Tag>
                <p className={styles.microHint}>
                  取整后复核照度 = {formatNumber(outcome.result.reverse.achievedIlluminance)} lux，不低于目标值
                </p>
              </div>
            ) : null}
            {outcome.result.requiredPhi !== undefined ? (
              <Tag color="purple" style={{ fontSize: 16, padding: '6px 16px' }}>
                所需单灯光通量 Φ ≈ {formatNumber(outcome.result.requiredPhi)} lm
              </Tag>
            ) : null}

            {(outcome.warnings ?? []).length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="设计提示"
                description={
                  <ul className={styles.warningList}>
                    {(outcome.warnings ?? []).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
          </div>
        ) : null}

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="常见场所照度参考（lux，入门提示）"
          description={
            <ul className={styles.warningList}>
              {ILLUMINANCE_REFERENCE.map((item) => (
                <li key={item.scene}>
                  {item.scene}：{item.lux}
                </li>
              ))}
            </ul>
          }
        />
      </Card>
    </div>
  );
};

export default AverageIlluminanceCalculator;
