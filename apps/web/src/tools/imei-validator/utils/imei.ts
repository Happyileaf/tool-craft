/**
 * IMEI（International Mobile Equipment Identity）校验与拆解
 *
 * 依据 3GPP TS 23.003：IMEI 为 15 位十进制数字，结构为
 * TAC（Type Allocation Code，8 位）+ SNR（Serial Number，6 位）+ Luhn 校验位（1 位）。
 * 输入为 16 位时按 IMEISV 处理：TAC（8）+ SNR（6）+ SVN（Software Version Number，2），
 * 不含 Luhn 校验位，仅做格式校验。
 */

export type ImeiKind = 'imei' | 'imeisv' | 'unknown';

export interface ImeiAnalysis {
  /** 去除空格/连字符后的纯数字串 */
  normalized: string;
  kind: ImeiKind;
  /** 是否仅含数字且长度合法 */
  formatValid: boolean;
  /** Luhn 校验是否通过（IMEISV 无校验位，固定为 null） */
  luhnValid: boolean | null;
  /** 用前 14 位计算出的应有校验位 */
  expectedCheckDigit: number | null;
  tac: string | null;
  snr: string | null;
  /** IMEI 的实际校验位，或 IMEISV 的 SVN */
  trailing: string | null;
  errors: string[];
}

/**
 * Luhn 算法（mod 10）计算校验位
 *
 * 从右向左，偶数位置（相对校验位）数字乘 2，乘积超过 9 则减去 9，
 * 总和模 10 后取补码。
 */
export function luhnCheckDigit(payload: string): number {
  let sum = 0;
  for (let i = 0; i < payload.length; i += 1) {
    let digit = payload.charCodeAt(payload.length - 1 - i) - 48;
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** 宽松归一化：去除空格、连字符 */
export function normalizeImei(input: string): string {
  return input.replace(/[\s-]/g, '');
}

/**
 * 分析 IMEI / IMEISV 输入
 */
export function analyzeImei(rawInput: string): ImeiAnalysis {
  const normalized = normalizeImei(rawInput);
  const errors: string[] = [];

  if (!normalized) {
    return {
      normalized,
      kind: 'unknown',
      formatValid: false,
      luhnValid: null,
      expectedCheckDigit: null,
      tac: null,
      snr: null,
      trailing: null,
      errors: [],
    };
  }

  if (!/^\d*$/.test(normalized)) {
    errors.push('只能包含数字（允许用空格或连字符分组）');
  }

  let kind: ImeiKind = 'unknown';
  if (normalized.length === 15) {
    kind = 'imei';
  } else if (normalized.length === 16) {
    kind = 'imeisv';
  } else if (/^\d*$/.test(normalized)) {
    errors.push(`长度为 ${normalized.length} 位：IMEI 应为 15 位，IMEISV（含软件版本号）应为 16 位`);
  }

  const formatValid = kind !== 'unknown' && errors.length === 0;

  let luhnValid: boolean | null = null;
  let expectedCheckDigit: number | null = null;
  let tac: string | null = null;
  let snr: string | null = null;
  let trailing: string | null = null;

  if (formatValid) {
    tac = normalized.slice(0, 8);
    snr = normalized.slice(8, 14);
    if (kind === 'imei') {
      trailing = normalized.slice(14, 15);
      expectedCheckDigit = luhnCheckDigit(normalized.slice(0, 14));
      luhnValid = expectedCheckDigit === Number(trailing);
      if (!luhnValid) {
        errors.push(`Luhn 校验位错误：应为 ${expectedCheckDigit}，实际为 ${trailing}`);
      }
    } else {
      trailing = normalized.slice(14, 16);
      luhnValid = null;
      if (trailing === '00') {
        errors.push('SVN 为 00：3GPP 规定 00 为保留值，通常不应出现在终端上');
      }
    }
  }

  return {
    normalized,
    kind,
    formatValid,
    luhnValid,
    expectedCheckDigit,
    tac,
    snr,
    trailing,
    errors,
  };
}
