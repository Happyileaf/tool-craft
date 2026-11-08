/**
 * LC 谐振与电抗计算的纯函数工具集：工程单位换算、谐振频率/L/C 互求、容抗与感抗。
 * 全部基于理想元件模型，浮点本地运算，不依赖 DOM。
 */

/** 支持的电感单位，换算系数指向亨利（H） */
export const INDUCTANCE_UNITS: Record<string, number> = {
  H: 1,
  mH: 1e-3,
  µH: 1e-6,
  uH: 1e-6,
  nH: 1e-9,
};

/** 支持的电容单位，换算系数指向法拉（F） */
export const CAPACITANCE_UNITS: Record<string, number> = {
  F: 1,
  mF: 1e-3,
  µF: 1e-6,
  uF: 1e-6,
  nF: 1e-9,
  pF: 1e-12,
};

/** 支持的频率单位，换算系数指向赫兹（Hz） */
export const FREQUENCY_UNITS: Record<string, number> = {
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
};

/**
 * 把带工程单位的数值换算为 SI 基准单位。
 *
 * @param value - 输入数值
 * @param unit - 单位键
 * @param unitMap - 单位换算表
 * @returns SI 基准单位下的数值
 */
export function toSi(value: number, unit: string, unitMap: Record<string, number>): number {
  const factor = unitMap[unit];
  if (factor === undefined) {
    throw new Error(`不支持的单位：${unit}`);
  }
  if (!Number.isFinite(value)) {
    throw new Error('数值必须为有限数');
  }
  return value * factor;
}

/**
 * 谐振频率 f₀ = 1 / (2π√(LC))。
 *
 * @param inductanceH - 电感（亨利）
 * @param capacitanceF - 电容（法拉）
 * @returns 谐振频率（赫兹）
 */
export function resonantFrequency(inductanceH: number, capacitanceF: number): number {
  if (!(inductanceH > 0) || !(capacitanceF > 0)) {
    throw new Error('电感与电容必须为正数');
  }
  return 1 / (2 * Math.PI * Math.sqrt(inductanceH * capacitanceF));
}

/**
 * 由目标谐振频率与电容反求电感 L = 1 / ((2πf)²C)。
 *
 * @param frequencyHz - 谐振频率（赫兹）
 * @param capacitanceF - 电容（法拉）
 * @returns 所需电感（亨利）
 */
export function inductanceForFrequency(frequencyHz: number, capacitanceF: number): number {
  if (!(frequencyHz > 0) || !(capacitanceF > 0)) {
    throw new Error('频率与电容必须为正数');
  }
  const omega = 2 * Math.PI * frequencyHz;
  return 1 / (omega * omega * capacitanceF);
}

/**
 * 由目标谐振频率与电感反求电容 C = 1 / ((2πf)²L)。
 *
 * @param frequencyHz - 谐振频率（赫兹）
 * @param inductanceH - 电感（亨利）
 * @returns 所需电容（法拉）
 */
export function capacitanceForFrequency(frequencyHz: number, inductanceH: number): number {
  if (!(frequencyHz > 0) || !(inductanceH > 0)) {
    throw new Error('频率与电感必须为正数');
  }
  const omega = 2 * Math.PI * frequencyHz;
  return 1 / (omega * omega * inductanceH);
}

/**
 * 感抗 Xl = 2πfL（欧姆）。
 *
 * @param frequencyHz - 频率（赫兹）
 * @param inductanceH - 电感（亨利）
 */
export function inductiveReactance(frequencyHz: number, inductanceH: number): number {
  if (!(frequencyHz > 0) || !(inductanceH > 0)) {
    throw new Error('频率与电感必须为正数');
  }
  return 2 * Math.PI * frequencyHz * inductanceH;
}

/**
 * 容抗 Xc = 1 / (2πfC)（欧姆）。
 *
 * @param frequencyHz - 频率（赫兹）
 * @param capacitanceF - 电容（法拉）
 */
export function capacitiveReactance(frequencyHz: number, capacitanceF: number): number {
  if (!(frequencyHz > 0) || !(capacitanceF > 0)) {
    throw new Error('频率与电容必须为正数');
  }
  return 1 / (2 * Math.PI * frequencyHz * capacitanceF);
}

/**
 * 为 SI 基准值选择最合适的工程单位并缩放，便于结果展示。
 *
 * @param siValue - SI 基准单位数值
 * @param unitMap - 单位换算表（键按从大到小选择）
 * @returns 缩放后的数值与单位键
 */
export function pickEngineeringUnit(
  siValue: number,
  unitMap: Record<string, number>,
): { value: number; unit: string } {
  if (!(siValue > 0)) {
    throw new Error('仅支持正数值的工程单位选择');
  }
  const entries = Object.entries(unitMap)
    // uH/uF 是 µ 的 ASCII 别名，展示时统一用 µ 形式
    .filter(([unit]) => !unit.startsWith('u'))
    .sort((a, b) => b[1] - a[1]);
  const match = entries.find(([, factor]) => siValue >= factor) ?? entries[entries.length - 1];
  return { value: siValue / match[1], unit: match[0] };
}

/** 常用标准 L/C 组合参考（用于给定目标频率下的选型提示） */
export const STANDARD_LC_PAIRS: { label: string; inductanceH: number; capacitanceF: number }[] = [
  { label: '10 µH + 100 nF', inductanceH: 10e-6, capacitanceF: 100e-9 },
  { label: '100 µH + 100 nF', inductanceH: 100e-6, capacitanceF: 100e-9 },
  { label: '100 µH + 100 pF', inductanceH: 100e-6, capacitanceF: 100e-12 },
  { label: '1 µH + 1 nF', inductanceH: 1e-6, capacitanceF: 1e-9 },
  { label: '10 µH + 1 nF', inductanceH: 10e-6, capacitanceF: 1e-9 },
  { label: '1 mH + 10 nF', inductanceH: 1e-3, capacitanceF: 10e-9 },
];
