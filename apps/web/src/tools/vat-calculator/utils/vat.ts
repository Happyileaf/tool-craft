/**
 * 中国增值税计算纯函数，不依赖 DOM 与 React。
 * 支持「不含税金额 + 税率 → 税额 / 含税金额」与
 * 「含税金额 + 税率 → 不含税金额 / 税额」两个方向，金额按两位小数四舍五入。
 */

/** 计算方向 */
export enum VatDirectionEnum {
  /** 输入不含税金额，正向算税额与含税金额 */
  EXCLUSIVE_TO_INCLUSIVE = 'exclusive-to-inclusive',
  /** 输入含税金额，反向拆出不含税金额与税额 */
  INCLUSIVE_TO_EXCLUSIVE = 'inclusive-to-exclusive',
}

/** 计算结果 */
export interface VatResult {
  /** 不含税金额（保留两位小数） */
  amountExcludingVat: number;
  /** 税额（保留两位小数） */
  taxAmount: number;
  /** 含税金额（保留两位小数） */
  amountIncludingVat: number;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 四舍五入到两位小数（避免浮点误差，先转为整数再取整）
 *
 * @param value - 原始数值
 * @returns 两位小数结果
 */
export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 校验金额与税率合法性
 *
 * @param amount - 输入金额
 * @param taxRatePercent - 税率百分比数值（如 13 表示 13%）
 * @returns 错误信息，合法为 null
 */
export function validateVatInput(amount: number, taxRatePercent: number): string | null {
  if (!Number.isFinite(amount)) {
    return '金额必须是有效数字';
  }
  if (amount < 0) {
    return '金额不能为负数';
  }
  if (!Number.isFinite(taxRatePercent)) {
    return '税率必须是有效数字';
  }
  if (taxRatePercent < 0) {
    return '税率不能小于 0%';
  }
  if (taxRatePercent >= 100) {
    return '税率必须小于 100%';
  }
  return null;
}

/**
 * 按方向计算增值税三项金额
 *
 * @param direction - 计算方向
 * @param amount - 输入金额（不含税或含税，取决于方向）
 * @param taxRatePercent - 税率百分比数值（如 13 表示 13%）
 * @returns 不含税金额、税额、含税金额及可能的错误
 */
export function calculateVat(
  direction: VatDirectionEnum,
  amount: number,
  taxRatePercent: number,
): VatResult {
  const error = validateVatInput(amount, taxRatePercent);
  if (error) {
    return { amountExcludingVat: 0, taxAmount: 0, amountIncludingVat: 0, error };
  }

  const rate = taxRatePercent / 100;

  if (direction === VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE) {
    const amountExcludingVat = roundTo2(amount);
    const taxAmount = roundTo2(amountExcludingVat * rate);
    const amountIncludingVat = roundTo2(amountExcludingVat + taxAmount);
    return { amountExcludingVat, taxAmount, amountIncludingVat, error: null };
  }

  const amountIncludingVat = roundTo2(amount);
  const amountExcludingVat = roundTo2(amountIncludingVat / (1 + rate));
  const taxAmount = roundTo2(amountIncludingVat - amountExcludingVat);
  return { amountExcludingVat, taxAmount, amountIncludingVat, error: null };
}
