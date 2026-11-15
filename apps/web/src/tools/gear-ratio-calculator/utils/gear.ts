/** 齿轮传动比与转速 / 扭矩计算的纯函数 */

/** 单级齿轮副 */
export interface GearStage {
  /** 主动轮齿数 */
  driverTeeth: number;
  /** 从动轮齿数 */
  drivenTeeth: number;
}

/** 单级计算结果 */
export interface SingleStageResult {
  /** 传动比 = 从动轮齿数 / 主动轮齿数 */
  ratio: number;
  /** 化简后的传动比分子 */
  ratioNumerator: number;
  /** 化简后的传动比分母 */
  ratioDenominator: number;
  /** 输出转速（RPM） */
  outputRpm: number;
  /** 输出扭矩（N·m） */
  outputTorque: number;
  /** 旋转方向 */
  direction: '正转' | '反转';
}

/** 多级计算结果 */
export interface MultiStageResult {
  /** 总传动比 */
  totalRatio: number;
  /** 化简后的总传动比分子 */
  ratioNumerator: number;
  /** 化简后的总分母 */
  ratioDenominator: number;
  /** 最终输出转速（RPM） */
  outputRpm: number;
  /** 最终输出扭矩（N·m） */
  outputTorque: number;
  /** 最终旋转方向 */
  direction: '正转' | '反转';
  /** 各级明细 */
  stages: Array<GearStage & { ratio: number; outputRpm: number; direction: '正转' | '反转' }>;
}

/**
 * 求最大公约数
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x || 1;
}

/**
 * 约分齿数比
 */
export function simplifyRatio(driverTeeth: number, drivenTeeth: number): { numerator: number; denominator: number } {
  const divisor = gcd(driverTeeth, drivenTeeth);
  return {
    numerator: drivenTeeth / divisor,
    denominator: driverTeeth / divisor,
  };
}

function assertTeeth(teeth: number, label: string): void {
  if (!Number.isInteger(teeth) || teeth < 1 || teeth > 500) {
    throw new Error(`${label}齿数需为 1–500 的整数`);
  }
}

function assertCommon(inputRpm: number, inputTorque: number, efficiencyPercent: number): void {
  if (!Number.isFinite(inputRpm) || inputRpm <= 0) {
    throw new Error('输入转速需大于 0');
  }
  if (!Number.isFinite(inputTorque) || inputTorque < 0) {
    throw new Error('输入扭矩不能为负数');
  }
  if (!Number.isFinite(efficiencyPercent) || efficiencyPercent < 50 || efficiencyPercent > 100) {
    throw new Error('传动效率需在 50–100% 之间');
  }
}

/**
 * 计算单级齿轮传动
 */
export function calculateSingleStage(
  driverTeeth: number,
  drivenTeeth: number,
  inputRpm: number,
  inputTorque: number,
  efficiencyPercent: number,
): SingleStageResult {
  assertTeeth(driverTeeth, '主动轮');
  assertTeeth(drivenTeeth, '从动轮');
  assertCommon(inputRpm, inputTorque, efficiencyPercent);

  const ratio = drivenTeeth / driverTeeth;
  const simplified = simplifyRatio(driverTeeth, drivenTeeth);
  return {
    ratio,
    ratioNumerator: simplified.numerator,
    ratioDenominator: simplified.denominator,
    outputRpm: inputRpm / ratio,
    outputTorque: inputTorque * ratio * (efficiencyPercent / 100),
    direction: '反转',
  };
}

/**
 * 计算多级齿轮串联传动，效率按每级分别作用
 */
export function calculateMultiStage(
  stages: GearStage[],
  inputRpm: number,
  inputTorque: number,
  efficiencyPercent: number,
): MultiStageResult {
  if (stages.length === 0) {
    throw new Error('请至少添加一级齿轮');
  }
  assertCommon(inputRpm, inputTorque, efficiencyPercent);
  stages.forEach((stage, index) => {
    assertTeeth(stage.driverTeeth, `第 ${index + 1} 级主动轮`);
    assertTeeth(stage.drivenTeeth, `第 ${index + 1} 级从动轮`);
  });

  let currentRpm = inputRpm;
  let numerator = 1;
  let denominator = 1;
  const details: MultiStageResult['stages'] = stages.map((stage, index) => {
    const ratio = stage.drivenTeeth / stage.driverTeeth;
    currentRpm /= ratio;
    numerator *= stage.drivenTeeth;
    denominator *= stage.driverTeeth;
    const direction = index % 2 === 0 ? '反转' : '正转';
    return { ...stage, ratio, outputRpm: currentRpm, direction };
  });

  const totalRatio = numerator / denominator;
  const divisor = gcd(numerator, denominator);
  return {
    totalRatio,
    ratioNumerator: numerator / divisor,
    ratioDenominator: denominator / divisor,
    outputRpm: currentRpm,
    outputTorque: inputTorque * totalRatio * (efficiencyPercent / 100) ** stages.length,
    direction: stages.length % 2 === 0 ? '正转' : '反转',
    stages: details,
  };
}

/**
 * 由目标输出转速反推单级从动轮齿数
 */
export function calculateDrivenTeeth(
  driverTeeth: number,
  inputRpm: number,
  targetOutputRpm: number,
): number {
  assertTeeth(driverTeeth, '主动轮');
  if (!Number.isFinite(inputRpm) || inputRpm <= 0) {
    throw new Error('输入转速需大于 0');
  }
  if (!Number.isFinite(targetOutputRpm) || targetOutputRpm <= 0) {
    throw new Error('目标输出转速需大于 0');
  }
  if (targetOutputRpm > inputRpm) {
    throw new Error('目标输出转速不能高于输入转速（单级减速传动）');
  }
  const raw = (driverTeeth * inputRpm) / targetOutputRpm;
  return Math.round(raw * 1000) / 1000;
}
