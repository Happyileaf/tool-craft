/**
 * Luhn（模 10）校验算法纯函数：仅处理数字字符串，不接触 DOM / React
 */

export interface LuhnStep {
  /** 原始位数字（0-9） */
  digit: number;
  /** 该位是否参与加倍（从右往左数的偶数位） */
  doubled: boolean;
  /** 该位对总和的实际贡献（加倍后按位求和） */
  contribution: number;
}

/**
 * 生成 Luhn 逐位计算过程：从最右侧校验位开始向左，
 * 处于偶数位置（右数第 2、4、6… 位）的数字先乘 2，结果大于 9 则减去 9
 *
 * @param digits - 仅含数字的字符串
 * @returns 从左到右的逐位明细
 */
export function luhnSteps(digits: string): LuhnStep[] {
  const chars = digits.split('');
  const length = chars.length;
  return chars.map((char, index) => {
    const digit = Number(char);
    const positionFromRight = length - index;
    const doubled = positionFromRight % 2 === 0;
    const product = doubled ? digit * 2 : digit;
    return {
      digit,
      doubled,
      contribution: product > 9 ? product - 9 : product,
    };
  });
}

/**
 * 计算 Luhn 总和
 *
 * @param digits - 仅含数字的字符串
 * @returns 各位贡献之和
 */
export function luhnSum(digits: string): number {
  return luhnSteps(digits).reduce((total, step) => total + step.contribution, 0);
}

/**
 * 校验完整卡号是否满足 Luhn（模 10）规则
 *
 * @param digits - 仅含数字的完整卡号
 * @returns 总和能被 10 整除即通过
 */
export function luhnCheck(digits: string): boolean {
  if (digits.length < 2 || !/^\d+$/.test(digits)) {
    return false;
  }
  return luhnSum(digits) % 10 === 0;
}

/**
 * 依据不含校验位的前缀号计算应有的校验位：
 * 末尾补 0 后计算 Luhn 总和，取使其成为 10 的整数倍所缺的数字
 *
 * @param partial - 不含最后一位校验位的数字串
 * @returns 0-9 的校验位；输入非法时返回 null
 */
export function computeCheckDigit(partial: string): number | null {
  if (partial.length < 1 || !/^\d+$/.test(partial)) {
    return null;
  }
  return (10 - (luhnSum(`${partial}0`) % 10)) % 10;
}
