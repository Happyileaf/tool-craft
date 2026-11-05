/**
 * LC 谐振与电抗计算（零依赖纯函数）
 *
 * 核心关系（理想无损 L、C）：
 * - 谐振角频率 ω₀ = 1 / √(LC)，谐振频率 f₀ = 1 / (2π√(LC))
 * - 感抗 Xl = 2πfL
 * - 容抗 Xc = 1 / (2πfC)
 * 谐振点满足 Xl = Xc。本模块不触碰 DOM 与 React，
 * 非法输入以抛出 Error 的方式返回中文提示。
 */

export type LcSolveMode = 'lc' | 'lf' | 'cf' | 'xl' | 'xc';

export interface UnitOption {
  /** 单位符号 */
  label: string;
  /** 相对基准单位（H / F / Hz / Ω）的倍率 */
  factor: number;
}

/** 各物理量允许的输入单位 */
export const UNIT_OPTIONS: Record<'L' | 'C' | 'f' | 'X', UnitOption[]> = {
  L: [
    { label: 'nH', factor: 1e-9 },
    { label: 'µH', factor: 1e-6 },
    { label: 'mH', factor: 1e-3 },
    { label: 'H', factor: 1 },
  ],
  C: [
    { label: 'pF', factor: 1e-12 },
    { label: 'nF', factor: 1e-9 },
    { label: 'µF', factor: 1e-6 },
    { label: 'F', factor: 1 },
  ],
  f: [
    { label: 'Hz', factor: 1 },
    { label: 'kHz', factor: 1e3 },
    { label: 'MHz', factor: 1e6 },
    { label: 'GHz', factor: 1e9 },
  ],
  X: [
    { label: 'Ω', factor: 1 },
    { label: 'kΩ', factor: 1e3 },
    { label: 'MΩ', factor: 1e6 },
  ],
};

export interface QuantityInput {
  /** 按所选单位填写的数值 */
  value: number;
  /** 所选单位相对基准单位的倍率 */
  factor: number;
}

export interface LcSolution {
  /** 电感（H），电抗模式下可能为 null */
  L: number | null;
  /** 电容（F），电抗模式下可能为 null */
  C: number | null;
  /** 频率（Hz） */
  f: number;
  /** 角频率 ω = 2πf（rad/s） */
  omega: number;
  /** 感抗（Ω），缺少 L 时为 null */
  Xl: number | null;
  /** 容抗（Ω），缺少 C 时为 null */
  Xc: number | null;
  /** 求解所用公式 */
  formula: string;
}

export interface LcInput {
  mode: LcSolveMode;
  L?: QuantityInput;
  C?: QuantityInput;
  f?: QuantityInput;
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
 * LC 谐振与电抗求解。
 *
 * - lc：给定 L、C 求谐振频率 f₀
 * - lf：给定 L、f₀ 反求 C
 * - cf：给定 C、f₀ 反求 L
 * - xl：给定 L、f 求感抗 Xl
 * - xc：给定 C、f 求容抗 Xc
 *
 * @throws 输入缺失或非正数时抛出带中文说明的 Error
 */
export function solveLc(input: LcInput): LcSolution {
  switch (input.mode) {
    case 'lc': {
      const L = requirePositive(input.L, '电感 L');
      const C = requirePositive(input.C, '电容 C');
      const f = 1 / (2 * Math.PI * Math.sqrt(L * C));
      const omega = 2 * Math.PI * f;
      return {
        L,
        C,
        f,
        omega,
        Xl: omega * L,
        Xc: 1 / (omega * C),
        formula: 'f₀ = 1 / (2π√(LC))',
      };
    }
    case 'lf': {
      const L = requirePositive(input.L, '电感 L');
      const f = requirePositive(input.f, '谐振频率 f₀');
      // 由 f = 1/(2π√(LC)) 得 C = 1/(4π²f²L)
      const C = 1 / (4 * Math.PI ** 2 * f ** 2 * L);
      const omega = 2 * Math.PI * f;
      return {
        L,
        C,
        f,
        omega,
        Xl: omega * L,
        Xc: 1 / (omega * C),
        formula: 'C = 1 / (4π²·f₀²·L)',
      };
    }
    case 'cf': {
      const C = requirePositive(input.C, '电容 C');
      const f = requirePositive(input.f, '谐振频率 f₀');
      // 由 f = 1/(2π√(LC)) 得 L = 1/(4π²f²C)
      const L = 1 / (4 * Math.PI ** 2 * f ** 2 * C);
      const omega = 2 * Math.PI * f;
      return {
        L,
        C,
        f,
        omega,
        Xl: omega * L,
        Xc: 1 / (omega * C),
        formula: 'L = 1 / (4π²·f₀²·C)',
      };
    }
    case 'xl': {
      const L = requirePositive(input.L, '电感 L');
      const f = requirePositive(input.f, '频率 f');
      const omega = 2 * Math.PI * f;
      return {
        L,
        C: null,
        f,
        omega,
        Xl: omega * L,
        Xc: null,
        formula: 'Xl = 2πfL',
      };
    }
    case 'xc': {
      const C = requirePositive(input.C, '电容 C');
      const f = requirePositive(input.f, '频率 f');
      const omega = 2 * Math.PI * f;
      return {
        L: null,
        C,
        f,
        omega,
        Xl: null,
        Xc: 1 / (omega * C),
        formula: 'Xc = 1 / (2πfC)',
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

function pickPrefix(value: number, table: { threshold: number; unit: string }[]): FormattedQuantity {
  const fallback = table[table.length - 1] as { threshold: number; unit: string };
  const chosen = table.find(
    (entry) => value < entry.threshold * 1000 && value >= entry.threshold,
  );
  const entry = chosen ?? fallback;
  return { value: value / entry.threshold, unit: entry.unit };
}

/** 按数量级自适应单位格式化电感（nH/µH/mH/H） */
export function formatInductance(henry: number): FormattedQuantity {
  if (henry >= 1) return { value: henry, unit: 'H' };
  if (henry >= 1e-3) return { value: henry / 1e-3, unit: 'mH' };
  if (henry >= 1e-6) return { value: henry / 1e-6, unit: 'µH' };
  return { value: henry / 1e-9, unit: 'nH' };
}

/** 按数量级自适应单位格式化电容（pF/nF/µF/F） */
export function formatCapacitance(farad: number): FormattedQuantity {
  if (farad >= 1) return { value: farad, unit: 'F' };
  if (farad >= 1e-6) return { value: farad / 1e-6, unit: 'µF' };
  if (farad >= 1e-9) return { value: farad / 1e-9, unit: 'nF' };
  return { value: farad / 1e-12, unit: 'pF' };
}

/** 按数量级自适应单位格式化频率（Hz/kHz/MHz/GHz） */
export function formatFrequency(hz: number): FormattedQuantity {
  return pickPrefix(hz, [
    { threshold: 1, unit: 'Hz' },
    { threshold: 1e3, unit: 'kHz' },
    { threshold: 1e6, unit: 'MHz' },
    { threshold: 1e9, unit: 'GHz' },
  ]);
}

/** 按数量级自适应单位格式化电抗（Ω/kΩ/MΩ） */
export function formatReactance(ohm: number): FormattedQuantity {
  return pickPrefix(ohm, [
    { threshold: 1, unit: 'Ω' },
    { threshold: 1e3, unit: 'kΩ' },
    { threshold: 1e6, unit: 'MΩ' },
  ]);
}

/** 按数量级自适应单位格式化角频率（rad/s/krad/s/Mrad/s） */
export function formatAngularFrequency(radPerSec: number): FormattedQuantity {
  if (radPerSec >= 1e6) return { value: radPerSec / 1e6, unit: 'Mrad/s' };
  if (radPerSec >= 1e3) return { value: radPerSec / 1e3, unit: 'krad/s' };
  return { value: radPerSec, unit: 'rad/s' };
}

/**
 * 在给定目标谐振频率下列出常用标准电容值对应的参考电感。
 * 返回的电感为理想计算值（非 E 系列标准值），仅作选型参考。
 */
export function suggestCombinations(targetFreq: number): Array<{
  capacitance: number;
  inductance: number;
}> {
  if (!Number.isFinite(targetFreq) || targetFreq <= 0) {
    throw new Error('目标谐振频率必须为正数');
  }
  // 常用标准电容（E12 量级代表值，单位 F）
  const standardCapacitances = [
    10e-12, 22e-12, 47e-12, 100e-12, 220e-12, 470e-12,
    1e-9, 2.2e-9, 4.7e-9, 10e-9, 22e-9, 47e-9, 100e-9,
  ];
  return standardCapacitances.map((capacitance) => ({
    capacitance,
    inductance: 1 / (4 * Math.PI ** 2 * targetFreq ** 2 * capacitance),
  }));
}
