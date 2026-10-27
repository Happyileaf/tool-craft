/**
 * 欧姆定律计算器常量
 */
import type { QuantityKey } from './utils/ohms';

/** 字段展示配置 */
export interface FieldMeta {
  /** 电学量标识 */
  key: QuantityKey;
  /** 中文名 */
  label: string;
  /** 基准单位符号 */
  baseUnit: string;
  /** 占位提示 */
  placeholder: string;
}

/** 四个输入字段的顺序与展示信息 */
export const FIELDS: FieldMeta[] = [
  { key: 'V', label: '电压 V', baseUnit: 'V', placeholder: '如 5' },
  { key: 'I', label: '电流 I', baseUnit: 'A', placeholder: '如 0.005' },
  { key: 'R', label: '电阻 R', baseUnit: 'Ω', placeholder: '如 1000' },
  { key: 'P', label: '功率 P', baseUnit: 'W', placeholder: '如 0.025' },
];

/** 一组示例电路的预设 */
export interface ExamplePreset {
  /** 预设名称 */
  name: string;
  /** 恰好两个已知量 */
  inputs: Partial<Record<QuantityKey, { value: number; unit: string }>>;
}

/** 示例预设集合 */
export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    name: '5V / 1kΩ（LED 限流）',
    inputs: {
      V: { value: 5, unit: 'V' },
      R: { value: 1, unit: 'kΩ' },
    },
  },
  {
    name: '12V / 4Ω（直流负载）',
    inputs: {
      V: { value: 12, unit: 'V' },
      R: { value: 4, unit: 'Ω' },
    },
  },
  {
    name: '220V / 1100W（市电电器）',
    inputs: {
      V: { value: 220, unit: 'V' },
      P: { value: 1100, unit: 'W' },
    },
  },
  {
    name: '100Ω / 0.25W（双解开方）',
    inputs: {
      R: { value: 100, unit: 'Ω' },
      P: { value: 0.25, unit: 'W' },
    },
  },
];
