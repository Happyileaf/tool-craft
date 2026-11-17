/**
 * 年金现值 / 终值计算核心（货币时间价值 TVM）
 *
 * 四类年金（A 为每期收付额，i 为每期利率，n 为收付期数，m 为递延期数）：
 * - 普通年金 ordinary（期末收付）：
 *     PVA = A·PVIFA，FVA = A·FVIFA
 * - 预付年金 due（期初收付）：普通年金结果 × (1+i)
 * - 递延年金 deferred（递延 m 期后开始 n 期普通收付）：
 *     PV = 普通 PVA / (1+i)^m，FV（收付期末时点）= 普通 FVA
 * - 永续年金 perpetuity：PV = A/i（预付永续 PV = A/i + A），FV 无定义
 *
 * 系数：
 * - 年金现值系数 PVIFA(i,n) = [1 − (1+i)^−n] / i
 * - 年金终值系数 FVIFA(i,n) = [(1+i)^n − 1] / i
 * - 资本回收系数 = 1 / PVIFA
 * - 偿债基金系数 = 1 / FVIFA
 *
 * 纯函数、零第三方依赖；i=0 走极限闭式分支。
 */

/** 年金类型 */
export type AnnuityType = 'ordinary' | 'due' | 'deferred' | 'perpetuity';

/** 反算目标 */
export type SolveTarget = 'pv' | 'fv';

/** 年金计算输入 */
export interface AnnuityInput {
  /** 年金类型 */
  type: AnnuityType;
  /** 每期收付额 A（正数值） */
  payment: number;
  /** 每期利率 i（小数，如 0.05 表示 5%） */
  ratePerPeriod: number;
  /** 收付期数 n（正整数；永续型忽略） */
  periods: number;
  /** 递延期数 m（非负整数，仅递延型使用） */
  deferralPeriods?: number;
  /** 是否为期初收付的预付永续年金（仅永续型使用，PV=A/i+A） */
  perpetuityDue?: boolean;
}

/** 校验利率：i 必须为有限数值且 i > −1（即 > −100%） */
function assertRate(rate: number): void {
  if (!Number.isFinite(rate)) {
    throw new Error('期利率必须是有限数值。');
  }
  if (rate <= -1) {
    throw new Error('期利率必须大于 −100%。');
  }
}

/** 校验正整数期数 */
function assertPositiveIntegerPeriods(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name}必须为正整数。`);
  }
}

/** 校验非负整数期数 */
function assertNonNegativeIntegerPeriods(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name}必须为非负整数。`);
  }
}

/** 校验正数金额 */
function assertPositiveAmount(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name}必须大于 0。`);
  }
}

/** 校验数值未溢出 */
function assertFiniteResult(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('计算结果溢出，请降低利率或期数后重试。');
  }
  return value;
}

/**
 * 年金现值系数 PVIFA(i,n) = [1 − (1+i)^−n] / i
 *
 * i=0 时极限为 n。
 *
 * @param ratePerPeriod - 期利率 i（小数）
 * @param periods - 期数 n（正整数）
 * @returns 现值系数
 */
export function pvifa(ratePerPeriod: number, periods: number): number {
  assertRate(ratePerPeriod);
  assertPositiveIntegerPeriods(periods, '期数 n');
  if (ratePerPeriod === 0) return periods;
  const compound = Math.pow(1 + ratePerPeriod, periods);
  return assertFiniteResult((1 - 1 / compound) / ratePerPeriod);
}

/**
 * 年金终值系数 FVIFA(i,n) = [(1+i)^n − 1] / i
 *
 * i=0 时极限为 n。
 *
 * @param ratePerPeriod - 期利率 i（小数）
 * @param periods - 期数 n（正整数）
 * @returns 终值系数
 */
export function fvifa(ratePerPeriod: number, periods: number): number {
  assertRate(ratePerPeriod);
  assertPositiveIntegerPeriods(periods, '期数 n');
  if (ratePerPeriod === 0) return periods;
  const compound = Math.pow(1 + ratePerPeriod, periods);
  return assertFiniteResult((compound - 1) / ratePerPeriod);
}

/**
 * 资本回收系数 = i / [1 − (1+i)^−n] = 1 / PVIFA
 *
 * i=0 时极限为 1/n。
 *
 * @param ratePerPeriod - 期利率 i（小数）
 * @param periods - 期数 n（正整数）
 * @returns 资本回收系数
 */
export function capitalRecoveryFactor(ratePerPeriod: number, periods: number): number {
  return 1 / pvifa(ratePerPeriod, periods);
}

/**
 * 偿债基金系数 = i / [(1+i)^n − 1] = 1 / FVIFA
 *
 * i=0 时极限为 1/n。
 *
 * @param ratePerPeriod - 期利率 i（小数）
 * @param periods - 期数 n（正整数）
 * @returns 偿债基金系数
 */
export function sinkingFundFactor(ratePerPeriod: number, periods: number): number {
  return 1 / fvifa(ratePerPeriod, periods);
}

/** 预付因子：期初收付相对期末收付整体前移一期，× (1+i)；i=0 时为 1 */
function dueFactor(ratePerPeriod: number): number {
  return 1 + ratePerPeriod;
}

/**
 * 现值系数（A 前的乘子），按年金类型分支
 *
 * @param type - 年金类型
 * @param ratePerPeriod - 期利率 i
 * @param periods - 期数 n
 * @param deferralPeriods - 递延期 m（递延型）
 * @param perpetuityDue - 是否预付永续（仅永续型生效，系数 = (1+i)/i）
 * @returns PV = A × 该系数
 */
export function presentValueFactor(
  type: AnnuityType,
  ratePerPeriod: number,
  periods: number,
  deferralPeriods = 0,
  perpetuityDue = false,
): number {
  assertRate(ratePerPeriod);
  if (type === 'perpetuity') {
    if (ratePerPeriod === 0) {
      throw new Error('利率为 0 时永续年金现值无定义（A/i 发散）。');
    }
    // 普通永续 A/i；预付永续 A/i + A = A·(1+i)/i
    const base = 1 / ratePerPeriod;
    return assertFiniteResult(perpetuityDue ? base * dueFactor(ratePerPeriod) : base);
  }

  assertPositiveIntegerPeriods(periods, '期数 n');
  const base = pvifa(ratePerPeriod, periods);

  if (type === 'ordinary') return base;
  if (type === 'due') return assertFiniteResult(base * dueFactor(ratePerPeriod));

  // 递延年金：普通 PVA 再折现 m 期
  assertNonNegativeIntegerPeriods(deferralPeriods, '递延期 m');
  if (ratePerPeriod === 0) return base;
  const discount = Math.pow(1 + ratePerPeriod, deferralPeriods);
  return assertFiniteResult(base / discount);
}

/**
 * 终值系数（A 前的乘子），按年金类型分支
 *
 * 永续年金终值无定义，返回 null；递延年金终值时点取最后一次收付期末，
 * 与递延期无关，故等于普通（或预付）终值系数。
 *
 * @param type - 年金类型
 * @param ratePerPeriod - 期利率 i
 * @param periods - 期数 n
 * @returns FV = A × 该系数；永续型返回 null
 */
export function futureValueFactor(
  type: AnnuityType,
  ratePerPeriod: number,
  periods: number,
): number | null {
  if (type === 'perpetuity') return null;
  assertRate(ratePerPeriod);
  assertPositiveIntegerPeriods(periods, '期数 n');
  const base = fvifa(ratePerPeriod, periods);
  if (type === 'due') return assertFiniteResult(base * dueFactor(ratePerPeriod));
  return base;
}

/**
 * 年金现值 PV
 *
 * @param input - 年金计算输入
 * @returns 现值金额
 */
export function pvAnnuity(input: AnnuityInput): number {
  assertPositiveAmount(input.payment, '每期收付额 A');
  const factor = presentValueFactor(
    input.type,
    input.ratePerPeriod,
    input.periods,
    input.deferralPeriods ?? 0,
    input.perpetuityDue ?? false,
  );
  return assertFiniteResult(input.payment * factor);
}

/**
 * 年金终值 FV
 *
 * @param input - 年金计算输入
 * @returns 终值金额；永续年金返回 null（n→∞ 时终值无定义）
 */
export function fvAnnuity(input: AnnuityInput): number | null {
  assertPositiveAmount(input.payment, '每期收付额 A');
  const factor = futureValueFactor(input.type, input.ratePerPeriod, input.periods);
  if (factor === null) return null;
  return assertFiniteResult(input.payment * factor);
}

/**
 * 反算每期收付额 A
 *
 * - 目标现值：A = 目标 PV / 现值系数
 * - 目标终值：A = 目标 FV / 终值系数（永续型无终值，报错）
 *
 * @param type - 年金类型
 * @param target - 反算目标（PV 或 FV）
 * @param targetValue - 目标金额（正数）
 * @param ratePerPeriod - 期利率 i
 * @param periods - 期数 n
 * @param deferralPeriods - 递延期 m（递延型）
 * @param perpetuityDue - 是否预付永续（仅永续型生效）
 * @returns 每期收付额 A
 */
export function solvePayment(
  type: AnnuityType,
  target: SolveTarget,
  targetValue: number,
  ratePerPeriod: number,
  periods: number,
  deferralPeriods = 0,
  perpetuityDue = false,
): number {
  assertPositiveAmount(targetValue, '目标金额');
  if (target === 'fv') {
    const fvFactor = futureValueFactor(type, ratePerPeriod, periods);
    if (fvFactor === null) {
      throw new Error('永续年金终值无定义，无法按目标终值反算收付额。');
    }
    return assertFiniteResult(targetValue / fvFactor);
  }
  const pvFactor = presentValueFactor(
    type,
    ratePerPeriod,
    periods,
    deferralPeriods,
    perpetuityDue,
  );
  return assertFiniteResult(targetValue / pvFactor);
}

/**
 * 百分数利率转小数（3.5 → 0.035）
 *
 * @param percent - 百分数数值
 * @returns 小数利率
 */
export function percentToRate(percent: number): number {
  if (!Number.isFinite(percent)) {
    throw new Error('利率必须是有限数值。');
  }
  return percent / 100;
}
