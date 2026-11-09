/**
 * LED 限流电阻计算纯函数（零依赖）
 *
 * 基本关系：R = (Vs − Vf_total) / If，电阻功耗 P = I²·R。
 * 拓扑：单路；N 颗串联时 Vf_total = N×Vf、电流不变；
 * N 颗并联（每路独立电阻）时每路按单路计算，总电流为 N×If。
 * E24 选型在全系列（×1、×10、…、×10^6）中取不小于理想值的最接近标称值，
 * 向上取值可保证实际电流不超过目标电流（避免过流）。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */
import { E24_BASE, E24_DECADE_MAX, E24_DECADE_MIN } from '../constants';

/** LED 连接拓扑：单路 / N 颗串联 / N 颗并联（每路独立电阻） */
export type LedTopology = 'single' | 'series' | 'parallel';

/** 计算器输入（电流单位为 mA，与界面输入一致） */
export interface LedInputs {
  /** 电源电压 Vs（V） */
  supplyVoltage: number | null;
  /** 单颗 LED 正向压降 Vf（V） */
  forwardVoltage: number | null;
  /** 目标工作电流 If（mA） */
  targetCurrentMa: number | null;
  /** 连接拓扑 */
  topology: LedTopology;
  /** LED 颗数 N（单路时按 1 处理） */
  count: number | null;
}

/** 计算结果：错误分支下各数值字段为 null，错误信息写入 error */
export interface LedResult {
  /** 错误信息，无错误为 null */
  error: string | null;
  /** LED 总正向压降（V） */
  vfTotal: number | null;
  /** 理想限流电阻（Ω） */
  idealResistance: number | null;
  /** 单颗电阻的理想功耗（W） */
  idealPower: number | null;
  /** 推荐的 E24 标称阻值（Ω），超范围为 null */
  recommended: number | null;
  /** 选用标称值后的单路实际电流（mA） */
  actualCurrentMa: number | null;
  /** 实际电流相对目标电流的偏差（%，负为欠流） */
  currentDeviationPercent: number | null;
  /** 电路总电流（mA），并联时为各支路之和 */
  totalCurrentMa: number | null;
  /** 全部限流电阻的总功耗（W） */
  totalPower: number | null;
  /** 非阻断性提示（并联方案说明、偏差过大等） */
  warnings: string[];
}

/** 数值四舍五入到指定小数位，并消除 -0 */
export function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * 按十倍频范围展开 E24 全系列阻值
 *
 * @param decadeMin - 最小十倍幂（0 表示 ×1）
 * @param decadeMax - 最大十倍幂（6 表示 ×10^6）
 * @returns 升序排列的标称阻值（Ω）
 */
export function e24Series(decadeMin: number, decadeMax: number): number[] {
  const values: number[] = [];
  for (let decade = decadeMin; decade <= decadeMax; decade += 1) {
    for (const base of E24_BASE) {
      values.push(round(base * 10 ** decade, 6));
    }
  }
  return values;
}

/**
 * 在 E24 全系列中选取不小于目标阻值的最小标称值（向上选型，避免过流）
 *
 * @param target - 理想电阻（Ω），必须为正的有限数
 * @returns 标称阻值（Ω）；超出全系列范围（1Ω～9.1MΩ）或入参非法时返回 null
 */
export function selectE24Ceiling(target: number): number | null {
  if (!Number.isFinite(target) || target <= 0) {
    return null;
  }
  const wanted = round(target, 6);
  for (const value of e24Series(E24_DECADE_MIN, E24_DECADE_MAX)) {
    if (value >= wanted) {
      return value;
    }
  }
  return null;
}

/** E24 候选行（供结果表格展示理想值附近的标称值） */
export interface E24Candidate {
  /** 标称阻值（Ω） */
  value: number;
  /** 相对理想值的偏差（%，正为偏大、负为偏小） */
  deltaPercent: number;
  /** 是否为向上选型命中的推荐值 */
  isCeiling: boolean;
}

/**
 * 列出理想阻值附近的若干 E24 候选，推荐值（向上选型）居中偏前
 *
 * @param target - 理想电阻（Ω）
 * @param max - 最多返回的候选数量
 * @returns 候选阻值与偏差；入参非法时返回空数组
 */
export function listE24Candidates(target: number, max = 8): E24Candidate[] {
  if (!Number.isFinite(target) || target <= 0) {
    return [];
  }
  const series = e24Series(E24_DECADE_MIN, E24_DECADE_MAX);
  const wanted = round(target, 6);
  let ceilingIndex = series.findIndex((value) => value >= wanted);
  if (ceilingIndex === -1) {
    ceilingIndex = series.length - 1;
  }
  const start = Math.max(0, ceilingIndex - 3);
  const end = Math.min(series.length, start + max);
  return series.slice(start, end).map((value) => ({
    value,
    deltaPercent: round(((value - target) / target) * 100, 2),
    isCeiling: value === series[ceilingIndex],
  }));
}

/** 错误结果的构造简写 */
function fail(error: string): LedResult {
  return {
    error,
    vfTotal: null,
    idealResistance: null,
    idealPower: null,
    recommended: null,
    actualCurrentMa: null,
    currentDeviationPercent: null,
    totalCurrentMa: null,
    totalPower: null,
    warnings: [],
  };
}

/**
 * LED 限流电阻主计算：校验输入、求理想电阻与功耗、E24 选型并回代实际电流
 *
 * @param inputs - 界面表单输入（Vs / Vf / If(mA) / 拓扑 / 颗数）
 * @returns 计算结果对象；任何边界错误均通过 error 字段返回，不抛异常
 */
export function calculateLedResistor(inputs: LedInputs): LedResult {
  const { supplyVoltage, forwardVoltage, targetCurrentMa, topology, count } = inputs;

  if (supplyVoltage === null || !Number.isFinite(supplyVoltage)) {
    return fail('电源电压 Vs 缺失或不是有效数值');
  }
  if (forwardVoltage === null || !Number.isFinite(forwardVoltage)) {
    return fail('正向压降 Vf 缺失或不是有效数值');
  }
  if (targetCurrentMa === null || !Number.isFinite(targetCurrentMa)) {
    return fail('目标电流 If 缺失或不是有效数值');
  }
  if (count === null || !Number.isFinite(count)) {
    return fail('LED 数量 N 缺失或不是有效数值');
  }
  if (!Number.isInteger(count) || count < 1) {
    return fail('LED 数量 N 必须为正整数（1、2、3…）');
  }
  if (targetCurrentMa <= 0) {
    return fail('目标电流 If 必须大于 0');
  }
  if (supplyVoltage <= 0) {
    return fail('电源电压 Vs 必须大于 0');
  }
  if (forwardVoltage <= 0) {
    return fail('正向压降 Vf 必须大于 0');
  }

  // 单路按 1 颗处理；串联压降累加；并联每路只承担一颗 LED 的压降
  const ledCount = topology === 'single' ? 1 : count;
  const vfTotal = topology === 'series' ? round(ledCount * forwardVoltage, 6) : forwardVoltage;

  if (supplyVoltage <= vfTotal) {
    return fail(
      `电源电压 Vs（${supplyVoltage}V）不大于 LED 总压降（${vfTotal}V），电阻上无剩余压差、无法限流：请提高电源电压或减少串联颗数`,
    );
  }

  const targetCurrentA = targetCurrentMa / 1000;
  const idealResistance = round((supplyVoltage - vfTotal) / targetCurrentA, 6);
  const idealPower = round(targetCurrentA * targetCurrentA * idealResistance, 6);

  const recommended = selectE24Ceiling(idealResistance);
  const warnings: string[] = [];

  if (topology === 'parallel') {
    warnings.push(
      '并联拓扑按「每路独立限流电阻」计算；多颗 LED 共用单颗限流电阻会因 Vf 离散导致电流分配不均，不推荐。',
    );
  }

  if (recommended === null) {
    return {
      ...fail(
        `理想电阻约 ${formatResistance(idealResistance)}，已超出 E24 全系列范围（1Ω～9.1MΩ），无法给出标称选型`,
      ),
      vfTotal,
      idealResistance,
      idealPower,
      warnings,
    };
  }

  // 选用标称值后回代：I = (Vs − Vf_total) / R
  const actualCurrentA = (supplyVoltage - vfTotal) / recommended;
  const actualCurrentMa = round(actualCurrentA * 1000, 4);
  const currentDeviationPercent = round(
    ((actualCurrentA - targetCurrentA) / targetCurrentA) * 100,
    2,
  );
  const branchPower = round(actualCurrentA * actualCurrentA * recommended, 6);
  const branchCount = topology === 'parallel' ? ledCount : 1;
  const totalCurrentMa = round(actualCurrentMa * branchCount, 4);
  const totalPower = round(branchPower * branchCount, 6);

  if (Math.abs(currentDeviationPercent) > 10) {
    warnings.push(
      `实际电流偏离目标 ${currentDeviationPercent}%（超过 10%）：E24 颗粒度不足，可改用 E96 系列或调整电源电压。`,
    );
  }

  return {
    error: null,
    vfTotal,
    idealResistance,
    idealPower,
    recommended,
    actualCurrentMa,
    currentDeviationPercent,
    totalCurrentMa,
    totalPower,
    warnings,
  };
}

/** 自动选择 Ω/kΩ/MΩ 单位展示阻值 */
export function formatResistance(ohm: number): string {
  if (!Number.isFinite(ohm)) return String(ohm);
  const abs = Math.abs(ohm);
  if (abs >= 1_000_000) return `${round(ohm / 1_000_000, 4)} MΩ`;
  if (abs >= 1_000) return `${round(ohm / 1_000, 4)} kΩ`;
  return `${round(ohm, 4)} Ω`;
}

/** 安培电流转换为 mA 展示字符串 */
export function formatCurrentMa(milliamp: number): string {
  return `${round(milliamp, 4)} mA`;
}

/** 功耗自适应单位展示：≥1W 用 W，否则用 mW */
export function formatPower(watt: number): string {
  if (!Number.isFinite(watt)) return String(watt);
  if (Math.abs(watt) >= 1) return `${round(watt, 4)} W`;
  return `${round(watt * 1000, 4)} mW`;
}
