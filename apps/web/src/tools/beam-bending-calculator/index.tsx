'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  LENGTH_UNITS,
  FORCE_UNITS,
  LINE_LOAD_UNITS,
  MODULUS_UNITS,
  INERTIA_UNITS,
  SECTION_MODULUS_UNITS,
  rectangleSection,
  circleSection,
  calculateBeam,
  type BeamType,
  type LoadType,
  type SectionType,
  type UnitOption,
} from './utils/beam';
import {
  MATERIAL_PRESETS,
  BEAM_TYPE_OPTIONS,
  loadTypeOptions,
  SECTION_TYPE_OPTIONS,
  SLENDER_RATIO_WARN,
} from './constants';
import styles from './index.module.css';

type NullableNumber = number | null;

/** 数值字段（值 + 单位标签） */
interface NumberField {
  value: NullableNumber;
  unit: string;
}

interface FormState {
  beamType: BeamType;
  loadType: LoadType;
  sectionType: SectionType;
  length: NumberField;
  pointLoad: NumberField;
  uniformLoad: NumberField;
  loadPosition: NumberField;
  rectWidth: NumberField;
  rectHeight: NumberField;
  circleDiameter: NumberField;
  customInertia: NumberField;
  customModulus: NumberField;
  elasticModulus: NumberField;
  allowableStress: NumberField;
  materialPreset: string;
}

function initialState(): FormState {
  const steel = MATERIAL_PRESETS[0] as (typeof MATERIAL_PRESETS)[number];
  return {
    beamType: 'simply-supported',
    loadType: 'central-point',
    sectionType: 'rectangle',
    length: { value: 4, unit: 'm' },
    pointLoad: { value: 10, unit: 'kN' },
    uniformLoad: { value: 2, unit: 'kN/m' },
    loadPosition: { value: 1.5, unit: 'm' },
    rectWidth: { value: 100, unit: 'mm' },
    rectHeight: { value: 200, unit: 'mm' },
    circleDiameter: { value: 120, unit: 'mm' },
    customInertia: { value: null, unit: 'cm⁴' },
    customModulus: { value: null, unit: 'cm³' },
    elasticModulus: { value: steel.modulus / 1e9, unit: 'GPa' },
    allowableStress: { value: steel.allowableStress ? steel.allowableStress / 1e6 : null, unit: 'MPa' },
    materialPreset: steel.name,
  };
}

function factorOf(options: UnitOption[], label: string): number {
  return options.find((item) => item.label === label)?.factor ?? 1;
}

function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e7)) return value.toExponential(digits - 1);
  return String(parseFloat(value.toPrecision(8)));
}

/** 带单位下拉的数字输入 */
const UnitInput: React.FC<{
  label: string;
  field: NumberField;
  options: UnitOption[];
  onChange: (field: NumberField) => void;
  placeholder?: string;
}> = ({ label, field, options, onChange, placeholder }) => (
  <div className={styles.fieldCard}>
    <div className={styles.fieldLabel}>{label}</div>
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        style={{ flex: 1 }}
        placeholder={placeholder}
        value={field.value}
        onChange={(value) => onChange({ ...field, value: value === null ? null : Number(value) })}
      />
      <Select
        style={{ width: 96 }}
        value={field.unit}
        onChange={(unit) => onChange({ ...field, unit })}
        options={options.map((u) => ({ label: u.label, value: u.label }))}
      />
    </Space.Compact>
  </div>
);

/**
 * 梁弯曲应力与挠度计算器
 *
 * @returns 梁计算交互界面
 */
const BeamBendingCalculator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<FormState>(initialState);
  const patch = (key: keyof FormState, value: unknown) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const applyMaterial = (name: string) => {
    const preset = MATERIAL_PRESETS.find((item) => item.name === name);
    patch('materialPreset', name);
    if (!preset || name === '自定义') return;
    setForm((previous) => ({
      ...previous,
      materialPreset: name,
      elasticModulus: { value: preset.modulus / 1e9, unit: 'GPa' },
      allowableStress: {
        value: preset.allowableStress ? preset.allowableStress / 1e6 : null,
        unit: 'MPa',
      },
    }));
  };

  const outcome = React.useMemo(() => {
    try {
      const length = (form.length.value ?? NaN) * factorOf(LENGTH_UNITS, form.length.unit);
      if (!Number.isFinite(length) || length <= 0) return { error: '请填写大于 0 的梁长 L。' };

      // 截面性质
      let inertia: number;
      let sectionModulus: number;
      let slenderWarning: string | null = null;
      if (form.sectionType === 'rectangle') {
        const b = (form.rectWidth.value ?? NaN) * factorOf(LENGTH_UNITS, form.rectWidth.unit);
        const h = (form.rectHeight.value ?? NaN) * factorOf(LENGTH_UNITS, form.rectHeight.unit);
        if (!(b > 0) || !(h > 0)) return { error: '请填写大于 0 的矩形截面宽 b 与高 h。' };
        const section = rectangleSection(b, h);
        inertia = section.inertia;
        sectionModulus = section.sectionModulus;
        if (Math.max(h, b) / Math.min(h, b) > SLENDER_RATIO_WARN) {
          slenderWarning =
            '截面高宽比超过 50，可能发生局部屈曲或侧向失稳，本工具仅按纯弯曲估算，结果仅供参考。';
        }
      } else if (form.sectionType === 'circle') {
        const d = (form.circleDiameter.value ?? NaN) * factorOf(LENGTH_UNITS, form.circleDiameter.unit);
        if (!(d > 0)) return { error: '请填写大于 0 的圆截面直径 d。' };
        const section = circleSection(d);
        inertia = section.inertia;
        sectionModulus = section.sectionModulus;
      } else {
        inertia = (form.customInertia.value ?? NaN) * factorOf(INERTIA_UNITS, form.customInertia.unit);
        sectionModulus =
          (form.customModulus.value ?? NaN) *
          factorOf(SECTION_MODULUS_UNITS, form.customModulus.unit);
        if (!(inertia > 0) || !(sectionModulus > 0)) {
          return { error: '请填写大于 0 的惯性矩 I 与截面模量 W。' };
        }
      }

      const modulus =
        (form.elasticModulus.value ?? NaN) * factorOf(MODULUS_UNITS, form.elasticModulus.unit);
      if (!(modulus > 0)) return { error: '请填写大于 0 的弹性模量 E。' };

      const base = {
        beamType: form.beamType,
        loadType: form.loadType,
        length,
      };

      if (form.loadType === 'uniform') {
        const q = (form.uniformLoad.value ?? NaN) * factorOf(LINE_LOAD_UNITS, form.uniformLoad.unit);
        if (!(q > 0)) return { error: '请填写大于 0 的均布荷载 q。' };
        Object.assign(base, { uniformLoad: q });
      } else {
        const p = (form.pointLoad.value ?? NaN) * factorOf(FORCE_UNITS, form.pointLoad.unit);
        if (!(p > 0)) return { error: '请填写大于 0 的集中力 P。' };
        Object.assign(base, { pointLoad: p });
        if (form.loadType === 'arbitrary-point') {
          const a = (form.loadPosition.value ?? NaN) * factorOf(LENGTH_UNITS, form.loadPosition.unit);
          if (!Number.isFinite(a)) return { error: '请填写荷载位置 a。' };
          Object.assign(base, { loadPosition: a });
        }
      }

      const allowableRaw = form.allowableStress.value;
      const allowableStress =
        allowableRaw === null || allowableRaw === undefined
          ? undefined
          : allowableRaw * 1e6; // MPa → Pa

      const result = calculateBeam({
        ...base,
        modulus,
        section: { inertia, sectionModulus },
        allowableStress,
      });
      if (slenderWarning) result.warnings.push(slenderWarning);
      return { result };
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
    const r = outcome.result;
    const lines = [
      `最大弯矩 Mmax: ${formatNumber(r.moment.maxMoment)} N·m（x=${formatNumber(r.moment.location)} m，${r.moment.formula}）`,
      `最大弯曲应力 σmax: ${formatNumber(r.maxStress / 1e6)} MPa`,
      `最大挠度 δmax: ${formatNumber(r.deflection.maxDeflection * 1000)} mm（L/δ=${formatNumber(r.spanDeflectionRatio)}）`,
      r.check
        ? `强度校核: ${r.check.pass ? '通过' : '超限'}，利用率 ${formatNumber(r.check.utilizationPercent)}%`
        : '强度校核: 未填写许用应力，已跳过',
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const isPointLoad = form.loadType !== 'uniform';

  return (
    <div className={styles.container}>
      <Card
        title="梁弯曲应力与挠度计算器（简支 / 悬臂、点载与均布载）"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          选择梁形式与荷载类型，输入梁长、截面尺寸（或直接给 I、W）与弹性模量，按材料力学标准梁表闭式解输出
          最大弯矩 Mmax、弯曲正应力 σ=M/W、最大挠度 δmax，并可按许用应力做强度校核。全部本地计算。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>梁形式</div>
            <Select
              style={{ width: '100%' }}
              value={form.beamType}
              onChange={(value: BeamType) => {
                patch('beamType', value);
                patch('loadType', 'central-point');
              }}
              options={BEAM_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            />
            <p className={styles.microHint}>
              {BEAM_TYPE_OPTIONS.find((item) => item.value === form.beamType)?.hint}
            </p>
          </div>

          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>荷载类型</div>
            <Select
              style={{ width: '100%' }}
              value={form.loadType}
              onChange={(value: LoadType) => patch('loadType', value)}
              options={loadTypeOptions(form.beamType)}
            />
          </div>

          <UnitInput
            label="梁长 L"
            field={form.length}
            options={LENGTH_UNITS}
            onChange={(field) => patch('length', field)}
          />

          {isPointLoad ? (
            <UnitInput
              label="集中力 P"
              field={form.pointLoad}
              options={FORCE_UNITS}
              onChange={(field) => patch('pointLoad', field)}
            />
          ) : (
            <UnitInput
              label="均布荷载 q"
              field={form.uniformLoad}
              options={LINE_LOAD_UNITS}
              onChange={(field) => patch('uniformLoad', field)}
            />
          )}

          {form.loadType === 'arbitrary-point' ? (
            <UnitInput
              label={form.beamType === 'cantilever' ? '荷载位置 a（距固定端）' : '荷载位置 a（距左端）'}
              field={form.loadPosition}
              options={LENGTH_UNITS}
              onChange={(field) => patch('loadPosition', field)}
            />
          ) : null}
        </div>

        <h4 className={styles.sectionTitle}>截面参数</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>截面类型</div>
            <Select
              style={{ width: '100%' }}
              value={form.sectionType}
              onChange={(value: SectionType) => patch('sectionType', value)}
              options={SECTION_TYPE_OPTIONS}
            />
          </div>

          {form.sectionType === 'rectangle' ? (
            <>
              <UnitInput
                label="截面宽度 b"
                field={form.rectWidth}
                options={LENGTH_UNITS}
                onChange={(field) => patch('rectWidth', field)}
              />
              <UnitInput
                label="截面高度 h"
                field={form.rectHeight}
                options={LENGTH_UNITS}
                onChange={(field) => patch('rectHeight', field)}
              />
            </>
          ) : null}

          {form.sectionType === 'circle' ? (
            <UnitInput
              label="圆截面直径 d"
              field={form.circleDiameter}
              options={LENGTH_UNITS}
              onChange={(field) => patch('circleDiameter', field)}
            />
          ) : null}

          {form.sectionType === 'custom' ? (
            <>
              <UnitInput
                label="惯性矩 I"
                field={form.customInertia}
                options={INERTIA_UNITS}
                onChange={(field) => patch('customInertia', field)}
              />
              <UnitInput
                label="截面模量 W"
                field={form.customModulus}
                options={SECTION_MODULUS_UNITS}
                onChange={(field) => patch('customModulus', field)}
              />
            </>
          ) : null}
        </div>

        <h4 className={styles.sectionTitle}>材料与校核</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>材料预设</div>
            <Select
              style={{ width: '100%' }}
              value={form.materialPreset}
              onChange={applyMaterial}
              options={MATERIAL_PRESETS.map((item) => ({ label: item.name, value: item.name }))}
            />
          </div>
          <UnitInput
            label="弹性模量 E"
            field={form.elasticModulus}
            options={MODULUS_UNITS}
            onChange={(field) => patch('elasticModulus', field)}
          />
          <UnitInput
            label="许用应力 [σ]（留空跳过校核）"
            field={form.allowableStress}
            options={[
              { label: 'MPa', factor: 1e6 },
              { label: 'Pa', factor: 1 },
              { label: 'GPa', factor: 1e9 },
            ]}
            onChange={(field) => patch('allowableStress', field)}
          />
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <Button size="small" onClick={reset}>
            重置为示例
          </Button>
        </Space>

        {outcome.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={outcome.error} />
        ) : null}

        {outcome.result ? (
          <div style={{ marginTop: 16 }}>
            {(() => {
              const r = outcome.result;
              return (
                <>
                  <Descriptions size="small" bordered column={2}>
                    <Descriptions.Item label="最大弯矩 Mmax">
                      <span className={styles.mono}>{formatNumber(r.moment.maxMoment)} N·m</span>
                      <div className={styles.microHint}>
                        x = {formatNumber(r.moment.location)} m；{r.moment.formula}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="最大弯曲应力 σmax">
                      <span className={styles.mono}>{formatNumber(r.maxStress / 1e6)} MPa</span>
                      <div className={styles.microHint}>σ = M / W</div>
                    </Descriptions.Item>
                    <Descriptions.Item label="最大挠度 δmax">
                      <span className={styles.mono}>{formatNumber(r.deflection.maxDeflection * 1000)} mm</span>
                      <div className={styles.microHint}>
                        x = {formatNumber(r.deflection.location)} m；{r.deflection.formula}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="跨挠比 L/δ">
                      <span className={styles.mono}>{formatNumber(r.spanDeflectionRatio)}</span>
                      <div className={styles.microHint}>
                        常用限值参考：L/250（楼盖）、L/360（吊顶）
                      </div>
                    </Descriptions.Item>
                  </Descriptions>

                  {r.check ? (
                    <div style={{ marginTop: 12 }}>
                      <Tag color={r.check.pass ? 'green' : 'red'} style={{ fontSize: 14, padding: '4px 12px' }}>
                        强度校核{r.check.pass ? '通过' : '超限'}：利用率 {formatNumber(r.check.utilizationPercent)}%
                      </Tag>
                      <span className={styles.microHint}>
                        判定规则 σmax ≤ [σ]，恰好等于许用值视为通过
                      </span>
                    </div>
                  ) : (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="info"
                      showIcon
                      message="未填写许用应力 [σ]，已跳过强度校核（应力与挠度结果不受影响）。"
                    />
                  )}

                  {r.warnings.length > 0 ? (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="warning"
                      showIcon
                      message="计算提示"
                      description={
                        <ul className={styles.warningList}>
                          {r.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      }
                    />
                  ) : null}

                  <Table
                    style={{ marginTop: 12 }}
                    size="small"
                    pagination={false}
                    dataSource={[
                      {
                        key: 'moment',
                        item: '最大弯矩 Mmax',
                        value: `${formatNumber(r.moment.maxMoment)} N·m`,
                        formula: r.moment.formula,
                      },
                      {
                        key: 'stress',
                        item: '最大弯曲应力 σmax',
                        value: `${formatNumber(r.maxStress / 1e6)} MPa`,
                        formula: 'σ = M / W',
                      },
                      {
                        key: 'deflection',
                        item: '最大挠度 δmax',
                        value: `${formatNumber(r.deflection.maxDeflection * 1000)} mm`,
                        formula: r.deflection.formula,
                      },
                    ]}
                    columns={[
                      { title: '项目', dataIndex: 'item', key: 'item', width: 180 },
                      {
                        title: '结果',
                        dataIndex: 'value',
                        key: 'value',
                        render: (text: string) => <span className={styles.mono}>{text}</span>,
                      },
                      {
                        title: '梁表公式',
                        dataIndex: 'formula',
                        key: 'formula',
                        render: (text: string) => <Tag className={styles.formulaTag}>{text}</Tag>,
                      },
                    ]}
                  />
                </>
              );
            })()}
          </div>
        ) : null}

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="适用范围"
          description="仅覆盖静定梁（简支 / 悬臂）的单一荷载工况与线弹性小变形等截面假设；不支持超静定梁、多种荷载叠加、压杆稳定与侧向扭转屈曲，相关需求请使用专业结构软件。"
        />
      </Card>
    </div>
  );
};

export default BeamBendingCalculator;
