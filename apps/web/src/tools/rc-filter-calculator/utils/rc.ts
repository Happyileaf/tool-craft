/**
 * 一阶 RC 低通 / 高通滤波器参数计算（零依赖纯函数）
 *
 * 核心关系：截止（-3 dB）频率 fc = 1 / (2πRC)，时间常数 τ = RC，
 * 角频率 ω = 2πfc = 1/τ。支持「知二求三」：
 * - rc：给定 R、C 求 fc
 * - rf：给定 R、fc 求 C
 * - cf：给定 C、fc 求 R
 * 本模块不触碰 DOM 与 React，非法输入以抛出 Error 的方式返回中文提示。
 */

export type RcSolveMode = 'rc' | 'rf' | 'cf';

export interface UnitOption {
  /** 单位符号 */
  label: string;
  /** 相对基准单位（Ω / F / Hz）的倍率 */
  factor: number;
}

/** 各物理量允许的输入单位 */
export const UNIT_OPTIONS: Record<'R' | 'C' | 'fc', UnitOption[]> = {
  R: [
    { label: 'Ω', factor: 1 },
    { label: 'kΩ', factor: 1e3 },
    { label: 'MΩ', factor: 1e6 },
  ],
  C: [
    { label: 'pF', factor: 1e-12 },
    { label: 'nF', factor: 1e-9 },
    { label: 'µF', factor: 1e-6 },
    { label: 'F', factor: 1 },
  ],
  fc: [
    { label: 'Hz', factor: 1 },
    { label: 'kHz', factor: 1e3 },
    { label: 'MHz', factor: 1e6 },
  ],
};

export interface QuantityInput {
  /** 按所选单位填写的数值 */
  value: number;
  /** 所选单位相对基准单位的倍率 */
  factor: number;
}

export interface RcSolution {
  /** 电阻（Ω） */
  R: number;
  /** 电容（F） */
  C: number;
  /** 截止频率（Hz） */
  fc: number;
  /** 时间常数 τ = RC（s） */
  tau: number;
  /** 角频率 ω = 2πfc（rad/s） */
  omega: number;
  /** 求解所用公式 */
  formula: string;
}

export interface RcInput {
  mode: RcSolveMode;
  R?: QuantityInput;
  C?: QuantityInput;
  fc?: QuantityInput;
}

/** 校验单个输入：存在、为有限正数，并返回基准单位数值 */
function requirePositive(input: QuantityInput | undefined, name: string): number {
  if (input === undefined) {
    throw new Error(`缺少已知量：${name}`);
  }
  const value = input.value * input.factor;
  if (!Number.isFinite(value)) {
    throw new Error(`${name} 不是有效数字`);
  }
  if (value <= 0) {
    throw new Error(`${name} 必须为正数`);
  }
  return value;
}

/**
 * 知二求三求解一阶 RC 参数。
 *
 * @throws 输入缺失或非正数时抛出带中文说明的 Error
 */
export function solveRc(input: RcInput): RcSolution {
  switch (input.mode) {
    case 'rc': {
      const R = requirePositive(input.R, '电阻 R');
      const C = requirePositive(input.C, '电容 C');
      const fc = 1 / (2 * Math.PI * R * C);
      return {
        R,
        C,
        fc,
        tau: R * C,
        omega: 2 * Math.PI * fc,
        formula: 'fc = 1 / (2πRC)',
      };
    }
    case 'rf': {
      const R = requirePositive(input.R, '电阻 R');
      const fc = requirePositive(input.fc, '截止频率 fc');
      const C = 1 / (2 * Math.PI * fc * R);
      return {
        R,
        C,
        fc,
        tau: R * C,
        omega: 2 * Math.PI * fc,
        formula: 'C = 1 / (2π·fc·R)',
      };
    }
    case 'cf': {
      const C = requirePositive(input.C, '电容 C');
      const fc = requirePositive(input.fc, '截止频率 fc');
      const R = 1 / (2 * Math.PI * fc * C);
      return {
        R,
        C,
        fc,
        tau: R * C,
        omega: 2 * Math.PI * fc,
        formula: 'R = 1 / (2π·fc·C)',
      };
    }
    default:
      throw new Error('未知的求解模式');
  }
}

export interface FormattedQuantity {
  value: number;
  unit: string;
}

/** 为电阻（Ω）选择 kΩ / MΩ 等合适前缀 */
function pickPrefix(value: number, table: { threshold: number; unit: string }[]): FormattedQuantity {
  const fallback = table[table.length - 1] as { threshold: number; unit: string };
  const chosen = table.find(
    (entry) => value < entry.threshold * 1000 && value >= entry.threshold,
  );
  const entry = chosen ?? fallback;
  return { value: value / entry.threshold, unit: entry.unit };
}

/** 按数量级自适应单位格式化电阻（Ω/kΩ/MΩ） */
export function formatResistance(ohm: number): FormattedQuantity {
  return pickPrefix(ohm, [
    { threshold: 1, unit: 'Ω' },
    { threshold: 1e3, unit: 'kΩ' },
    { threshold: 1e6, unit: 'MΩ' },
  ]);
}

/** 按数量级自适应单位格式化电容（pF/nF/µF/F） */
export function formatCapacitance(farad: number): FormattedQuantity {
  if (farad >= 1) return { value: farad, unit: 'F' };
  if (farad >= 1e-6) return { value: farad / 1e-6, unit: 'µF' };
  if (farad >= 1e-9) return { value: farad / 1e-9, unit: 'nF' };
  return { value: farad / 1e-12, unit: 'pF' };
}

/** 按数量级自适应单位格式化频率（Hz/kHz/MHz） */
export function formatFrequency(hz: number): FormattedQuantity {
  return pickPrefix(hz, [
    { threshold: 1, unit: 'Hz' },
    { threshold: 1e3, unit: 'kHz' },
    { threshold: 1e6, unit: 'MHz' },
  ]);
}

/** 按数量级自适应单位格式化时间（s/ms/µs/ns） */
export function formatTime(second: number): FormattedQuantity {
  if (second >= 1) return { value: second, unit: 's' };
  if (second >= 1e-3) return { value: second / 1e-3, unit: 'ms' };
  if (second >= 1e-6) return { value: second / 1e-6, unit: 'µs' };
  return { value: second / 1e-9, unit: 'ns' };
}

/** 按数量级自适应单位格式化角频率（rad/s） */
export function formatAngularFrequency(radPerSec: number): FormattedQuantity {
  if (radPerSec >= 1e6) return { value: radPerSec / 1e6, unit: 'Mrad/s' };
  if (radPerSec >= 1e3) return { value: radPerSec / 1e3, unit: 'krad/s' };
  return { value: radPerSec, unit: 'rad/s' };
}
