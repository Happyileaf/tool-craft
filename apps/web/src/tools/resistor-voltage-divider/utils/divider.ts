/**
 * 电阻分压器纯函数计算
 *
 * 无负载：Vout = Vin × R2 / (R1 + R2)
 * 带负载 RL 与 R2 并联：Rp = R2∥RL，Vout = Vin × Rp / (R1 + Rp)
 * 反解：给定 Vin、Vout、R1，求 R2 = R1 × Vout / (Vin − Vout)
 */

export interface DividerInputs {
  /** 输入电压（V） */
  inputVoltage: number;
  /** 上拉电阻 R1（Ω，接 Vin 与输出节点之间） */
  r1: number;
  /** 下拉电阻 R2（Ω，接输出节点与地之间）；反解模式可为 null */
  r2: number | null;
  /** 负载电阻 RL（Ω），null 表示空载 */
  rl: number | null;
}

export interface DividerResults {
  /** 输出电压（V） */
  outputVoltage: number;
  /** 分压比 Vout/Vin */
  ratio: number;
  /** R2 与 RL 的并联等效电阻（Ω），空载时等于 R2 */
  parallelResistance: number;
  /** 总电流（A），Vin/(R1+Rp) */
  totalCurrent: number;
  /** 负载电流（A），无负载为 0 */
  loadCurrent: number;
  /** 总功耗（W），Vin × 总电流 */
  totalPower: number;
  /** 负载效应导致的输出跌落相对空载的百分比（%），无负载为 0 */
  loadRegulationPercent: number;
  warnings: string[];
}

/**
 * 计算两电阻并联等效值。
 *
 * @param ra - 电阻 A（Ω）
 * @param rb - 电阻 B（Ω）
 * @returns 并联电阻（Ω）
 */
export function parallelResistance(ra: number, rb: number): number {
  return (ra * rb) / (ra + rb);
}

/**
 * 正向计算分压器输出（可含负载）。
 *
 * @param inputs - 输入电压与电阻值（基本单位 V / Ω）
 * @returns 输出电压、电流、功耗与告警
 */
export function calculateDivider(inputs: DividerInputs): DividerResults {
  const { inputVoltage, r1, r2, rl } = inputs;
  const warnings: string[] = [];

  if (r2 === null || !Number.isFinite(r2)) {
    throw new Error('R2 缺失');
  }

  const rp = rl !== null && rl > 0 ? parallelResistance(r2, rl) : r2;
  const totalResistance = r1 + rp;
  const outputVoltage = inputVoltage * (rp / totalResistance);
  const ratio = inputVoltage !== 0 ? outputVoltage / inputVoltage : 0;
  const totalCurrent = inputVoltage / totalResistance;
  const loadCurrent = rl !== null && rl > 0 ? outputVoltage / rl : 0;
  const totalPower = inputVoltage * totalCurrent;

  // 空载输出（用于负载效应比较）
  const noLoadOutput = inputVoltage * (r2 / (r1 + r2));
  const loadRegulationPercent =
    noLoadOutput !== 0 ? ((noLoadOutput - outputVoltage) / noLoadOutput) * 100 : 0;

  if (rl !== null && rl > 0 && rl < r2) {
    warnings.push('负载电阻 RL 小于 R2，负载效应显著，输出电压被明显拉低；建议 RL ≥ 10×R2。');
  } else if (rl !== null && rl > 0 && rl < 10 * r2) {
    warnings.push('RL 不足 R2 的 10 倍，负载对分压点有可见影响，已在结果中计入并联效应。');
  }
  if (r1 + r2 <= 0) {
    warnings.push('电阻之和为零，电路短路。');
  }

  return {
    outputVoltage,
    ratio,
    parallelResistance: rp,
    totalCurrent,
    loadCurrent,
    totalPower,
    loadRegulationPercent,
    warnings,
  };
}

export interface SolveR2Inputs {
  /** 输入电压（V） */
  inputVoltage: number;
  /** 目标输出电压（V） */
  targetOutputVoltage: number;
  /** 已知的上拉电阻 R1（Ω） */
  r1: number;
}

export interface SolveR2Results {
  /** 所需 R2（Ω） */
  r2: number;
  warnings: string[];
}

/**
 * 反解：给定 Vin、目标 Vout 与 R1，计算空载所需的 R2。
 *
 * @param inputs - 输入电压、目标电压与 R1
 * @returns R2 阻值与告警
 */
export function solveForR2(inputs: SolveR2Inputs): SolveR2Results {
  const { inputVoltage, targetOutputVoltage, r1 } = inputs;
  const warnings: string[] = [];

  if (targetOutputVoltage <= 0) {
    return { r2: 0, warnings: ['目标电压需大于 0；输出 0V 直接把输出节点接地即可。'] };
  }
  if (targetOutputVoltage >= inputVoltage) {
    warnings.push('目标输出电压必须小于输入电压；电阻分压只能降压，不能升压。');
    return { r2: Number.POSITIVE_INFINITY, warnings };
  }

  const r2 = (r1 * targetOutputVoltage) / (inputVoltage - targetOutputVoltage);
  if (inputVoltage - targetOutputVoltage < inputVoltage * 0.01) {
    warnings.push('目标电压非常接近输入电压，所需 R2 极大，实际难以选到标准阻值且极易受负载拉低。');
  }
  return { r2, warnings };
}
