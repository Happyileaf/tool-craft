'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  GAS_CONSTANT_R,
  MASS_UNITS,
  MOLAR_MASS_UNITS,
  MOLE_UNITS,
  PRESSURE_UNITS,
  REFERENCE_POINTS,
  VOLUME_UNITS,
  formatSignificant,
  molarVolumeAt,
  molesFromMass,
  solveIdealGas,
  toKelvin,
  type GasField,
  type GasLawResult,
  type TemperatureUnit,
} from './utils/ideal-gas';
import { COMMON_MOLAR_MASS, FIELD_META, FIELD_RESULT_NAME } from './constants';
import styles from './index.module.css';

type NullableNumber = number | null;

interface FieldState {
  value: NullableNumber;
  unit: string;
}

interface FormState {
  unknown: GasField;
  pressure: FieldState;
  volume: FieldState;
  moles: FieldState;
  temperature: FieldState & { tempUnit: TemperatureUnit };
  mass: { value: NullableNumber; unit: string };
  molarMass: { value: NullableNumber; unit: string };
}

function initialState(): FormState {
  return {
    unknown: 'volume',
    pressure: { value: 101325, unit: 'Pa' },
    volume: { value: null, unit: 'L' },
    moles: { value: 1, unit: 'mol' },
    temperature: { value: 0, unit: '°C', tempUnit: '°C' },
    mass: { value: 88.02, unit: 'g' },
    molarMass: { value: 44.0095, unit: 'g/mol' },
  };
}

const TEMP_UNITS: TemperatureUnit[] = ['K', '°C', '°F'];

interface Outcome {
  result?: GasLawResult;
  error?: string;
}

/**
 * 理想气体状态方程 PV=nRT 计算器（四量求一 + 单位换算）
 *
 * @returns 理想气体计算交互界面
 */
const IdealGasLawCalculator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<FormState>(initialState);

  const patchField = <F extends GasField>(field: F, patch: Partial<FormState[F]>) =>
    setForm((previous) => ({
      ...previous,
      [field]: { ...previous[field], ...patch },
    }));

  const outcome = React.useMemo<Outcome>(() => {
    try {
      const result = solveIdealGas({
        pressure: form.pressure,
        volume: form.volume,
        moles: form.moles,
        temperature: { ...form.temperature, tempUnit: form.temperature.tempUnit },
      });
      return { result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [form]);

  /** 切换待求字段：新待求量清空，原待求量给默认值 */
  const changeUnknown = (next: GasField) => {
    setForm((previous) => {
      const nextForm: FormState = { ...previous, unknown: next };
      // 原待求字段补一个占位默认值，避免出现两个空字段
      if (previous.unknown === 'pressure') nextForm.pressure = { value: 101325, unit: previous.pressure.unit };
      if (previous.unknown === 'volume') nextForm.volume = { value: 22.414, unit: previous.volume.unit };
      if (previous.unknown === 'moles') nextForm.moles = { value: 1, unit: previous.moles.unit };
      if (previous.unknown === 'temperature')
        nextForm.temperature = { ...previous.temperature, value: 25 };
      // 新待求字段清空（温度字段保留 tempUnit）
      if (next === 'temperature') {
        nextForm.temperature = { ...nextForm.temperature, value: null };
      } else {
        nextForm[next] = { ...nextForm[next], value: null };
      }
      return nextForm;
    });
  };

  /** 一键填充 STP / SATP 参考点（压强与温度），待求量保持不变 */
  const applyReference = (key: 'stp' | 'satp') => {
    const point = REFERENCE_POINTS.find((item) => item.key === key);
    if (!point) return;
    setForm((previous) => ({
      ...previous,
      pressure: { value: point.pressurePascal, unit: 'Pa' },
      temperature: { value: point.temperatureCelsius, unit: '°C', tempUnit: '°C' },
    }));
    message.success(`已填充 ${point.label}`);
  };

  /** 摩尔质量辅助：n = m / M，并回填物质的量字段 */
  const applyMolesFromMass = () => {
    try {
      const n = molesFromMass(
        form.mass.value ?? NaN,
        form.mass.unit,
        form.molarMass.value ?? NaN,
        form.molarMass.unit,
      );
      setForm((previous) => ({
        ...previous,
        moles: { value: parseFloat(n.toPrecision(8)), unit: 'mol' },
      }));
      message.success(`已回填 n = ${formatSignificant(n, 6)} mol`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    }
  };

  const reset = () => setForm(initialState());

  const copyResult = () => {
    if (!outcome.result) {
      message.warning('暂无可复制的结果');
      return;
    }
    const r = outcome.result;
    const lines = [
      `理想气体状态方程 PV=nRT（R=${GAS_CONSTANT_R} J/(mol·K)）`,
      `${FIELD_RESULT_NAME[r.unknown]} = ${formatSignificant(r.displayValue)} ${r.displayUnit}`,
      `SI 表达：${formatSignificant(r.siValue)} ${FIELD_META[r.unknown].siUnit}`,
      `代入：${r.formulaText}`,
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  /** 渲染一个物理量输入行（温度行单位走 TEMP_UNITS） */
  const renderFieldRow = (field: GasField) => {
    const meta = FIELD_META[field];
    const isUnknown = form.unknown === field;
    const state = form[field];
    const unitOptions =
      field === 'pressure'
        ? PRESSURE_UNITS
        : field === 'volume'
          ? VOLUME_UNITS
          : field === 'moles'
            ? MOLE_UNITS
            : [];
    return (
      <div key={field} className={styles.fieldCard}>
        <div className={styles.fieldLabel}>
          {meta.label}
          {isUnknown ? <Tag color="blue" style={{ marginLeft: 8 }}>待求</Tag> : null}
        </div>
        {field === 'temperature' ? (
          <Space style={{ width: '100%' }}>
            <InputNumber
              style={{ width: 180 }}
              value={state.value}
              disabled={isUnknown}
              placeholder={isUnknown ? '留空待求' : '输入数值'}
              onChange={(value) =>
                patchField('temperature', { value: value === null ? null : Number(value) })
              }
            />
            <Select
              style={{ width: 90 }}
              value={form.temperature.tempUnit}
              disabled={isUnknown}
              onChange={(unit: TemperatureUnit) =>
                setForm((previous) => ({
                  ...previous,
                  temperature: { ...previous.temperature, tempUnit: unit, unit },
                }))
              }
              options={TEMP_UNITS.map((unit) => ({ label: unit, value: unit }))}
            />
          </Space>
        ) : (
          <Space style={{ width: '100%' }}>
            <InputNumber
              style={{ width: 180 }}
              value={state.value}
              disabled={isUnknown}
              placeholder={isUnknown ? '留空待求' : '输入数值'}
              onChange={(value) => patchField(field, { value: value === null ? null : Number(value) })}
            />
            <Select
              style={{ width: 130 }}
              value={state.unit}
              disabled={isUnknown}
              onChange={(unit: string) => patchField(field, { unit })}
              options={unitOptions.map((item) => ({ label: item.label, value: item.label }))}
            />
          </Space>
        )}
        <p className={styles.microHint}>{meta.hint}</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card
        title="理想气体状态方程计算器（PV = nRT · 四量求一）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          四个物理量中选择一个作为待求量（留空），填写其余三个并选择单位，工具内部统一换算到
          SI（Pa、m³、mol、K）后按 PV=nRT 实时求解。通用气体常数
          R={GAS_CONSTANT_R} J/(mol·K)，全部计算在浏览器本地完成。
        </p>

        <h4 className={styles.sectionTitle}>待求量选择（恰好一个）</h4>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={form.unknown}
          onChange={(event) => changeUnknown(event.target.value as GasField)}
          options={(Object.keys(FIELD_META) as GasField[]).map((field) => ({
            label: FIELD_META[field].label,
            value: field,
          }))}
        />

        <h4 className={styles.sectionTitle}>参数输入</h4>
        <div className={styles.fieldGrid}>
          {(Object.keys(FIELD_META) as GasField[]).map((field) => renderFieldRow(field))}
        </div>

        <Space wrap style={{ marginTop: 12 }}>
          <Button size="small" onClick={reset}>
            重置为示例
          </Button>
          {REFERENCE_POINTS.map((point) => (
            <Button
              key={point.key}
              size="small"
              onClick={() => applyReference(point.key)}
            >
              填充 {point.label}
            </Button>
          ))}
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

        {outcome.result ? (
          <>
            <Tag color="green" style={{ marginTop: 16, fontSize: 16, padding: '6px 16px' }}>
              {FIELD_RESULT_NAME[outcome.result.unknown]} ≈{' '}
              {formatSignificant(outcome.result.displayValue)} {outcome.result.displayUnit}
            </Tag>
            <Descriptions style={{ marginTop: 12 }} size="small" bordered column={1}>
              <Descriptions.Item label="SI 单位结果">
                <span className={styles.mono}>
                  {formatSignificant(outcome.result.siValue)} {FIELD_META[outcome.result.unknown].siUnit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="公式代入">
                <span className={styles.mono}>{outcome.result.formulaText}</span>
              </Descriptions.Item>
              <Descriptions.Item label="气体常数">
                <span className={styles.mono}>R = {GAS_CONSTANT_R} J/(mol·K)</span>
              </Descriptions.Item>
            </Descriptions>
            {outcome.result.warning ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="物理情形警示"
                description={outcome.result.warning}
              />
            ) : null}
          </>
        ) : null}

        <Divider />

        <h4 className={styles.sectionTitle}>摩尔质量辅助：由质量 m 与摩尔质量 M 求 n = m / M</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>气体质量 m</div>
            <Space>
              <InputNumber
                style={{ width: 160 }}
                min={0}
                value={form.mass.value}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    mass: { ...previous.mass, value: value === null ? null : Number(value) },
                  }))
                }
              />
              <Select
                style={{ width: 90 }}
                value={form.mass.unit}
                onChange={(unit: string) =>
                  setForm((previous) => ({ ...previous, mass: { ...previous.mass, unit } }))
                }
                options={MASS_UNITS.map((item) => ({ label: item.label, value: item.label }))}
              />
            </Space>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>摩尔质量 M</div>
            <Space>
              <InputNumber
                style={{ width: 160 }}
                min={0}
                value={form.molarMass.value}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    molarMass: { ...previous.molarMass, value: value === null ? null : Number(value) },
                  }))
                }
              />
              <Select
                style={{ width: 100 }}
                value={form.molarMass.unit}
                onChange={(unit: string) =>
                  setForm((previous) => ({ ...previous, molarMass: { ...previous.molarMass, unit } }))
                }
                options={MOLAR_MASS_UNITS.map((item) => ({ label: item.label, value: item.label }))}
              />
            </Space>
          </div>
        </div>
        <Button style={{ marginTop: 12 }} type="primary" ghost size="small" onClick={applyMolesFromMass}>
          计算 n=m/M 并回填物质的量
        </Button>

        <h4 className={styles.sectionTitle}>常见气体摩尔质量参考（g/mol）</h4>
        <Table
          size="small"
          pagination={false}
          rowKey="formula"
          dataSource={[...COMMON_MOLAR_MASS]}
          columns={[
            { title: '气体', dataIndex: 'gas', key: 'gas' },
            { title: '分子式', dataIndex: 'formula', key: 'formula' },
            {
              title: '摩尔质量 (g/mol)',
              dataIndex: 'molarMass',
              key: 'molarMass',
              render: (value: number) => <span className={styles.mono}>{String(value)}</span>,
            },
          ]}
          onRow={(record) => ({
            onClick: () =>
              setForm((previous) => ({
                ...previous,
                molarMass: { value: record.molarMass, unit: 'g/mol' },
              })),
          })}
        />
        <p className={styles.microHint}>点击任意行可将其摩尔质量填入上方 M 字段。</p>

        <h4 className={styles.sectionTitle}>STP / SATP 参考点与摩尔体积对照</h4>
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={REFERENCE_POINTS.map((point) => ({
            key: point.key,
            label: point.label,
            t: `${point.temperatureKelvin} K（${point.temperatureCelsius} °C）`,
            p: `${point.pressurePascal} Pa`,
            vm: `${formatSignificant(molarVolumeAt(point) * 1000)} L/mol`,
            nominal: `${point.molarVolumeLPerMol} L/mol`,
          }))}
          columns={[
            { title: '参考点', dataIndex: 'label', key: 'label' },
            { title: '温度', dataIndex: 't', key: 't' },
            { title: '压强', dataIndex: 'p', key: 'p' },
            {
              title: 'Vm=RT/P 计算值',
              dataIndex: 'vm',
              key: 'vm',
              render: (value: string) => <span className={styles.mono}>{value}</span>,
            },
            { title: '标称摩尔体积', dataIndex: 'nominal', key: 'nominal' },
          ]}
        />

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="量纲与适用范围提示"
          description={
            <ul className={styles.warningList}>
              <li>理想气体模型假设分子无体积、无分子间作用力；高压或接近液化温度时偏差增大。</li>
              <li>温度必须使用绝对温度（K）参与运算，工具已自动完成 °C/°F 换算并校验 0 K 下限。</li>
              <li>当前输入温度换算为 {Number.isFinite(form.temperature.value ?? NaN) && form.temperature.value !== null
                ? formatSignificant(toKelvin(form.temperature.value as number, form.temperature.tempUnit))
                : '—'} K。</li>
            </ul>
          }
        />
      </Card>
    </div>
  );
};

export default IdealGasLawCalculator;
