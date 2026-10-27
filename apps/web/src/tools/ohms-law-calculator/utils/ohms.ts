/**
 * 欧姆定律与功率方程联立求解纯函数
 *
 * 四个电学量：电压 V（伏特）、电流 I（安培）、电阻 R（欧姆）、功率 P（瓦特）。
 * 基本关系：V = I·R，P = V·I = I²·R = V²/R。
 * 给定任意两个量即可求解其余两个量；R、P 组合需要开方，存在正负两个数学解。
 */

/** 电学量标识 */
export type QuantityKey = 'V' | 'I' | 'R' | 'P';

/** 单个电学量的带单位输入值 */
export interface QuantityInput {
  /** 输入的数值（按所选单位计） */
  value: number;
  /** 换算到基准单位（V/A/Ω/W）的倍率，如 mA 为 0.001 */
  factor: number;
}

/** 求解器输入：四个量中恰好填写两个 */
export type OhmsInputs = Partial<Record<QuantityKey, QuantityInput>>;

/** 单个未知量的求解结果 */
export interface SolvedQuantity {
  /** 基准单位下的数值 */
  value: number;
  /** 推导该值所用的公式 */
  formula: string;
}

/** 联立求解结果 */
export interface OhmsSolution {
  /** 各未知量的解（正极性解） */
  solved: Partial<Record<QuantityKey, SolvedQuantity>>;
  /**
   * R、P 组合开方时的负极性数学解；
   * 其余组合只有唯一解，该字段为 undefined
   */
  negative?: Partial<Record<QuantityKey, SolvedQuantity>>;
  /** 触发双解的说明 */
  dualNote?: string;
}

/**
 * 联立求解欧姆定律与功率方程
 *
 * @param inputs - 四个电学量中恰好两个已知量（带单位倍率）
 * @returns 其余两个量的解；R、P 组合额外返回负极性解
 * @throws 当已填字段数不等于 2、出现非有限数或物理无意义输入时抛出错误
 */
export function solveOhmsLaw(inputs: OhmsInputs): OhmsSolution {
  const keys = (Object.keys(inputs) as QuantityKey[]).filter(
    (key) => inputs[key] !== undefined,
  );

  if (keys.length !== 2) {
    throw new Error(`请恰好填写两个已知量（当前填写 ${keys.length} 个）`);
  }

  const base: Partial<Record<QuantityKey, number>> = {};
  for (const key of keys) {
    const entry = inputs[key];
    if (!entry) continue;
    const value = Number(entry.value);
    if (!Number.isFinite(value)) {
      throw new Error(`${labelOf(key)} 的数值无效`);
    }
    const factor = Number(entry.factor);
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error(`${labelOf(key)} 的单位倍率无效`);
    }
    const normalized = value * factor;
    if (key === 'R' && normalized < 0) {
      throw new Error('电阻不能为负数');
    }
    if (key === 'P' && normalized < 0) {
      throw new Error('功率不能为负数');
    }
    if (normalized < 0) {
      throw new Error(`${labelOf(key)} 不能为负数`);
    }
    base[key] = normalized;
  }

  const has = (key: QuantityKey): boolean => base[key] !== undefined;

  // V, I → R = V/I, P = V·I
  if (has('V') && has('I')) {
    const V = base.V as number;
    const I = base.I as number;
    if (I === 0) {
      throw new Error('电流为 0 时无法由 R = V/I 求电阻（零除）；若电压也为 0，电阻可为任意值，无解的唯一性');
    }
    return {
      solved: {
        R: { value: V / I, formula: 'R = V / I' },
        P: { value: V * I, formula: 'P = V · I' },
      },
    };
  }

  // V, R → I = V/R, P = V²/R
  if (has('V') && has('R')) {
    const V = base.V as number;
    const R = base.R as number;
    if (R === 0) {
      throw new Error('电阻为 0 时 I = V/R 发生零除（理想短路电流无界）');
    }
    return {
      solved: {
        I: { value: V / R, formula: 'I = V / R' },
        P: { value: (V * V) / R, formula: 'P = V² / R' },
      },
    };
  }

  // V, P → I = P/V, R = V²/P
  if (has('V') && has('P')) {
    const V = base.V as number;
    const P = base.P as number;
    if (V === 0) {
      throw new Error('电压为 0 时无法由 I = P/V、R = V²/P 反推（零除）');
    }
    if (P === 0) {
      throw new Error('给定电压非零而功率为 0 在物理上矛盾（必有非零电流）');
    }
    return {
      solved: {
        I: { value: P / V, formula: 'I = P / V' },
        R: { value: (V * V) / P, formula: 'R = V² / P' },
      },
    };
  }

  // I, R → V = I·R, P = I²·R
  if (has('I') && has('R')) {
    const I = base.I as number;
    const R = base.R as number;
    return {
      solved: {
        V: { value: I * R, formula: 'V = I · R' },
        P: { value: I * I * R, formula: 'P = I² · R' },
      },
    };
  }

  // I, P → V = P/I, R = P/I²
  if (has('I') && has('P')) {
    const I = base.I as number;
    const P = base.P as number;
    if (I === 0) {
      throw new Error('电流为 0 时无法由 V = P/I、R = P/I² 反推（零除）');
    }
    return {
      solved: {
        V: { value: P / I, formula: 'V = P / I' },
        R: { value: P / (I * I), formula: 'R = P / I²' },
      },
    };
  }

  // R, P → V = ±√(P·R), I = ±√(P/R)
  const R = base.R as number;
  const P = base.P as number;
  if (R === 0) {
    if (P === 0) {
      return {
        solved: {
          V: { value: 0, formula: 'V = √(P · R)' },
          I: { value: 0, formula: 'I = √(P / R)' },
        },
        dualNote: 'R = 0、P = 0 为退化情形：V = 0，电流不由这两个量唯一确定（此处显示 0）。',
      };
    }
    throw new Error('电阻为 0 而非零功率在物理上不可能（P = I²·0 = 0）');
  }
  const vAbs = Math.sqrt(P * R);
  const iAbs = Math.sqrt(P / R);
  if (P === 0) {
    return {
      solved: {
        V: { value: 0, formula: 'V = √(P · R)' },
        I: { value: 0, formula: 'I = √(P / R)' },
      },
    };
  }
  return {
    solved: {
      V: { value: vAbs, formula: 'V = √(P · R)' },
      I: { value: iAbs, formula: 'I = √(P / R)' },
    },
    negative: {
      V: { value: -vAbs, formula: 'V = −√(P · R)' },
      I: { value: -iAbs, formula: 'I = −√(P / R)' },
    },
    dualNote:
      '仅给定 R 与 P 时，开方存在正、负两个数学解，分别对应两种相反的电压 / 电流极性；常规直流电路取正极性解。',
  };
}

/** 电学量的中文名与基准单位 */
const QUANTITY_META: Record<QuantityKey, { label: string; unit: string }> = {
  V: { label: '电压', unit: 'V' },
  I: { label: '电流', unit: 'A' },
  R: { label: '电阻', unit: 'Ω' },
  P: { label: '功率', unit: 'W' },
};

/**
 * 取电学量的中文名称
 *
 * @param key - 电学量标识
 * @returns 中文名（电压 / 电流 / 电阻 / 功率）
 */
export function labelOf(key: QuantityKey): string {
  return QUANTITY_META[key].label;
}

/**
 * 取电学量的基准单位符号
 *
 * @param key - 电学量标识
 * @returns 基准单位（V/A/Ω/W）
 */
export function baseUnitOf(key: QuantityKey): string {
  return QUANTITY_META[key].unit;
}

/** 单位换算选项 */
export interface UnitOption {
  /** 单位符号 */
  label: string;
  /** 相对基准单位的倍率 */
  factor: number;
}

/** 各电学量支持的输入单位 */
export const UNIT_OPTIONS: Record<QuantityKey, UnitOption[]> = {
  V: [
    { label: 'V', factor: 1 },
    { label: 'mV', factor: 0.001 },
  ],
  I: [
    { label: 'A', factor: 1 },
    { label: 'mA', factor: 0.001 },
  ],
  R: [
    { label: 'Ω', factor: 1 },
    { label: 'kΩ', factor: 1000 },
    { label: 'MΩ', factor: 1_000_000 },
  ],
  P: [
    { label: 'W', factor: 1 },
    { label: 'mW', factor: 0.001 },
    { label: 'kW', factor: 1000 },
  ],
};

/**
 * 为基准单位下的数值自动选择合适的展示单位
 *
 * @param key - 电学量标识
 * @param baseValue - 基准单位下的数值（非负场景取绝对值展示）
 * @returns 换算后的数值、单位符号与所用倍率
 */
export function formatQuantity(
  key: QuantityKey,
  baseValue: number,
): { value: number; unit: string; factor: number } {
  const options = UNIT_OPTIONS[key];
  const abs = Math.abs(baseValue);
  // 零值固定使用基准单位；非零值按倍率降序选第一个「换算后数值 ≥ 1」的单位，
  // 都不满足则取最小倍率（毫单位）
  const base = options.find((option) => option.factor === 1) ?? (options[0] as UnitOption);
  if (baseValue === 0) {
    return { value: 0, unit: base.label, factor: 1 };
  }
  const sorted = [...options].sort((a, b) => b.factor - a.factor);
  let chosen = sorted[sorted.length - 1] as UnitOption;
  for (const option of sorted) {
    if (abs >= option.factor) {
      chosen = option;
      break;
    }
  }
  return { value: baseValue / chosen.factor, unit: chosen.label, factor: chosen.factor };
}
